import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '../supabaseClient';
import { useExport } from '../contexts/ExportContext';

const LinkList = ({ links, onDelete, onLinksUpdated }) => {
  const { registerExportFunction, unregisterExportFunction } = useExport();

  useEffect(() => {
    registerExportFunction();
    return () => {
      unregisterExportFunction();
    };
  }, [registerExportFunction, unregisterExportFunction]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'descending' });
  const [categoryOrder, setCategoryOrder] = useState([]);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [categoryOrderId, setCategoryOrderId] = useState(null);

  useEffect(() => {
    const fetchCategoryOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('category_order')
          .select('id, ordered_categories')
          .single(); // Assuming there's only one row for category order

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error('Error fetching category order:', error);
        } else if (data) {
          setCategoryOrder(data.ordered_categories || []);
          setCategoryOrderId(data.id);
        } else {
          // If no row exists, create one
          const { data: newOrderData, error: newOrderError } = await supabase
            .from('category_order')
            .insert({ ordered_categories: [] })
            .select('id')
            .single();

          if (newOrderError) {
            console.error('Error creating initial category order:', newOrderError);
          } else if (newOrderData) {
            setCategoryOrderId(newOrderData.id);
          }
        }
      } finally {
        setLoadingOrder(false);
      }
    };

    fetchCategoryOrder();
  }, []); // Empty dependency array means it runs once on mount

  const categories = useMemo(() => {
    const allCategories = links.map(link => link.category).filter(Boolean);
    return [...new Set(allCategories)];
  }, [links]);

  const sortedAndFilteredLinks = useMemo(() => {
    let sortableItems = [...links];

    // Filtering
    sortableItems = sortableItems.filter(link => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        link.title.toLowerCase().includes(searchLower) ||
        link.url.toLowerCase().includes(searchLower) ||
        (link.category && link.category.toLowerCase().includes(searchLower)) ||
        (link.author && link.author.toLowerCase().includes(searchLower));

      const matchesCategory = 
        !selectedCategory || (link.category && link.category === selectedCategory);

      return matchesSearch && matchesCategory;
    });

    // Sorting
    sortableItems.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    return sortableItems;
  }, [links, searchTerm, selectedCategory, sortConfig]);

  const groupedLinks = useMemo(() => {
    const groups = {};
    sortedAndFilteredLinks.forEach(link => {
      const category = link.category || '未分類';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(link);
    });
    return groups;
  }, [sortedAndFilteredLinks]);

  // Sort categories based on categoryOrder, new categories appended
  const orderedCategories = useMemo(() => {
    const currentCategories = Object.keys(groupedLinks);
    const newCategories = currentCategories.filter(cat => !categoryOrder.includes(cat));

    // Filter out categories that no longer exist in groupedLinks
    const filteredCategoryOrder = categoryOrder.filter(cat => currentCategories.includes(cat));

    return [...filteredCategoryOrder, ...newCategories];
  }, [groupedLinks, categoryOrder]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [originalCategoryName, setOriginalCategoryName] = useState('');

  const handleEditCategoryClick = (category) => {
    setOriginalCategoryName(category);
    setEditingCategoryName(category);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingCategoryName('');
    setOriginalCategoryName('');
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const onDragEnd = async (result) => {
    if (!result.destination) {
      return;
    }

    const newOrder = Array.from(orderedCategories);
    const [removed] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, removed);

    setCategoryOrder(newOrder);

    // Update order in Supabase
    try {
      // Assuming there's only one row for category order, or we update by a fixed ID
      const { error } = await supabase
        .from('category_order')
        .update({ ordered_categories: newOrder })
        .eq('id', categoryOrderId);

      if (error) {
        console.error('Error updating category order in Supabase:', error);
      }
    } catch (error) {
      console.error('Unexpected error updating category order:', error);
    }
  };

  const handleUpdateCategoryName = async () => {
    if (!editingCategoryName || editingCategoryName === originalCategoryName) {
      handleCloseEditModal();
      return;
    }

    try {
      // 1. Update links in the 'links' table
      const { error: linksUpdateError } = await supabase
        .from('links')
        .update({ category: editingCategoryName })
        .eq('category', originalCategoryName);

      if (linksUpdateError) {
        console.error('Error updating links category:', linksUpdateError);
        return;
      }

      // 2. Update category order in the 'category_order' table
      const newCategoryOrder = categoryOrder.map(cat => 
        cat === originalCategoryName ? editingCategoryName : cat
      );

      const { error: orderUpdateError } = await supabase
        .from('category_order')
        .update({ ordered_categories: newCategoryOrder })
        .eq('id', categoryOrderId);

      if (orderUpdateError) {
        console.error('Error updating category order table:', orderUpdateError);
        return;
      }

      // 3. Update local state (links and categoryOrder)
      // This requires re-fetching links or updating them in place
      // For simplicity and consistency, let's trigger a re-fetch of all links in App.js
      // However, since LinkList only receives 'links' prop, we need to update it here.
      // A full re-fetch from App.js would be better, but for now, update local state.
      // This part is tricky as 'links' is a prop. We need to inform parent (App.js) to re-fetch.
      // For now, we'll update the categoryOrder state and rely on App.js to eventually re-fetch or pass updated links.
      // A better approach would be to pass a 'onCategoryUpdate' prop from App.js

      // For immediate UI update, manually update the links prop (not ideal for props, but for demo)
      // This part needs a proper state management solution or re-fetching from App.js
      // For now, we'll just update the categoryOrder and hope links prop updates on next fetch.
      // A more robust solution would involve passing a callback from App.js to re-fetch links.

      // Let's update the categoryOrder state directly for immediate visual feedback
      setCategoryOrder(newCategoryOrder);

      // To update the links prop, we need a way to trigger a re-fetch in App.js
      // For now, the user will need to refresh the page to see links updated.
      // Or, we can add a callback prop from App.js to LinkList.js

      // Let's assume App.js will re-fetch links after this operation for simplicity.
      // Or, we can manually update the links prop if it's mutable (it's not directly).
      // The best way is to trigger a re-fetch in App.js.

      // For now, let's just close the modal and rely on the next full data fetch.
      // A more complete solution would involve a context API or Redux for global state management.

      // For this specific task, we will update the categoryOrder state and close the modal.
      // The links themselves will update on the next full data fetch from App.js.

      handleCloseEditModal();
      if (onLinksUpdated) { // Call the callback to re-fetch links in App.js
        onLinksUpdated();
      }
    } catch (error) {
      console.error('Unexpected error updating category name:', error);
    }
  };

  if (loadingOrder) {
    return <div>カテゴリーの並び順を読み込み中...</div>;
  }

  return (
    <div>
      <div className="card bg-light p-3 mb-4">
        <div className="row g-2">
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="キーワード検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <select 
              className="form-select" 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">すべてのカテゴリー</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <select 
              className="form-select"
              onChange={(e) => requestSort(e.target.value)}
              defaultValue="id"
            >
              <option value="id">並び替え: 追加日</option>
              <option value="title">タイトル</option>
              <option value="category">カテゴリー</option>
              <option value="author">追加者</option>
            </select>
          </div>
        </div>
      </div>

      {Object.keys(groupedLinks).length === 0 ? (
        <p className="text-muted">リンクが見つかりません。検索条件を変えるか、新しいリンクを追加してください。</p>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="categories">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {orderedCategories.map((category, index) => (
                  <Draggable key={category} draggableId={category} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.dragHandleProps}
                        className="mb-4"
                      >
                        <h3 className="h5 mb-2 d-flex justify-content-between align-items-center">
                          {category}
                          <button 
                            className="btn btn-sm btn-outline-secondary ms-2"
                            onClick={() => handleEditCategoryClick(category)}
                          >
                            編集
                          </button>
                        </h3>
                        <ul className="list-group">
                          {groupedLinks[category].map(link => (
                            <li key={link.id} className="list-group-item d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                              <div className="flex-grow-1 me-3" style={{ minWidth: 0 }}>
                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="fw-bold text-decoration-none" title={link.url}>
                                  {link.title}
                                </a>
                                <div className="text-muted small mt-1">
                                  {link.category && <span className="badge bg-secondary me-2 fw-normal">{link.category}</span>}
                                  <span>追加者: {link.author}</span>
                                  <span className="mx-2">|</span>
                                  <span>追加日: {new Date(link.id).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="mt-2 mt-md-0 ms-md-auto">
                                <Link to={`/edit/${link.id}`} className="btn btn-outline-secondary btn-sm me-2">
                                  編集
                                </Link>
                                <button onClick={() => onDelete(link.id)} className="btn btn-outline-danger btn-sm">
                                  削除
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Edit Category Modal */}
      <div className={`modal fade ${showEditModal ? 'show d-block' : ''}`} tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">カテゴリー名を編集</h5>
              <button type="button" className="btn-close" onClick={handleCloseEditModal} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                className="form-control"
                value={editingCategoryName}
                onChange={(e) => setEditingCategoryName(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCloseEditModal}>キャンセル</button>
              <button type="button" className="btn btn-primary" onClick={handleUpdateCategoryName}>保存</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LinkList;