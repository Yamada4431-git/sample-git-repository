import React, { useState } from 'react';

const AddLink = ({ onAdd }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [author, setAuthor] = useState(''); // New state for author

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !url || !author) { // Author is now required
      alert('タイトル、URL、追加者は必須です。');
      return;
    }
    onAdd({ title, url, category, author }); // Pass author in the new link object
  };

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title mb-4">新規リンクを追加</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="title" className="form-label">タイトル</label>
            <input
              type="text"
              className="form-control"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: React公式サイト"
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
              placeholder="https://ja.reactjs.org"
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
              placeholder="例: 設計、テスト、資料"
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
              placeholder="例: 山田太郎"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">リンクを追加</button>
        </form>
      </div>
    </div>
  );
};

export default AddLink;
