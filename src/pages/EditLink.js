import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EditLink = ({ links, onUpdate }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const linkToEdit = links.find(link => link.id === parseInt(id));

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [author, setAuthor] = useState(''); // New state for author

  useEffect(() => {
    if (linkToEdit) {
      setTitle(linkToEdit.title);
      setUrl(linkToEdit.url);
      setCategory(linkToEdit.category || '');
      setAuthor(linkToEdit.author || ''); // Set author state
    } else {
      navigate('/');
    }
  }, [linkToEdit, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !url || !author) { // Author is now required
      alert('タイトル、URL、追加者は必須です。');
      return;
    }
    onUpdate({ ...linkToEdit, title, url, category, author }); // Pass author in the updated object
  };

  if (!linkToEdit) {
    return null; 
  }

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title mb-4">リンクを編集</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="title" className="form-label">タイトル</label>
            <input
              type="text"
              className="form-control"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="url" className="form-label">URL</label>
            <input
              type="url"
              className="form-control"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="category" className="form-label">カテゴリー</label>
            <input
              type="text"
              className="form-control"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="author" className="form-label">追加者</label>
            <input
              type="text"
              className="form-control"
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-success">リンクを更新</button>
        </form>
      </div>
    </div>
  );
};

export default EditLink;
