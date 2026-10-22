
import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Users,
  BookOpen,
  Network,
  UserRound,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import "./style.css";

const STORAGE_KEY = "character-library-data";

const sampleCharacters = [
  {
    id: 1,
    name: "星乃 ルナ",
    world: "星屑の魔法学園",
    author: "サンプル作者",
    tags: ["魔法使い", "学生"],
    color: "#f1498c",
    description: "星屑の魔法学園に通う、明るく好奇心旺盛な魔法使い。",
  },
  {
    id: 2,
    name: "夜凪 カイ",
    world: "星屑の魔法学園",
    author: "サンプル作者",
    tags: ["剣士", "クール"],
    color: "#0f1c36",
    description: "冷静沈着な剣士。口数は少ないが、仲間思い。",
  },
  {
    id: 3,
    name: "森野 ミドリ",
    world: "森の住人たち",
    author: "サンプル作者",
    tags: ["自然", "癒し系"],
    color: "#adeb41",
    description: "森で暮らす、自然と動物が大好きなキャラクター。",
  },
];

// 画像を小さくして保存するための準備
const MAX_IMAGE_SIZE = 900;
// 画像を縮小して、保存しやすい形式に変換する
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const scale = Math.min(
          1,
          MAX_IMAGE_SIZE / Math.max(image.width, image.height)
        );

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/webp", 0.8));
      };

      image.onerror = reject;
      image.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const [search, setSearch] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [editingImages, setEditingImages] = useState([]);
  const handleImageChange = async (event) => {
  const files = Array.from(event.target.files);

  try {
    const images = await Promise.all(
      files.map((file) => resizeImage(file))
    );

    setSelectedImages(images);
  } catch (error) {
    alert("画像を読み込めませんでした。別の画像を試してください。");
  }
};

  const [characters, setCharacters] = useState(() => {
    try {
      const savedCharacters = localStorage.getItem(STORAGE_KEY);

      if (savedCharacters) {
        return JSON.parse(savedCharacters);
      }
    } catch (error) {
      console.error("保存データを読み込めませんでした", error);
    }

    return sampleCharacters;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
    } catch (error) {
      console.error("キャラクターを保存できませんでした", error);
    }
  }, [characters]);

  const filteredCharacters = characters.filter((character) => {
    const keyword = search.toLowerCase();

    return (
      character.name.toLowerCase().includes(keyword) ||
      character.world.toLowerCase().includes(keyword) ||
      character.tags.some((tag) => tag.toLowerCase().includes(keyword))
    );
  });

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home">
          <span className="brand-mark">
            <Sparkles size={21} />
          </span>
          <span>
            <strong>CHARA LIBRARY</strong>
            <small>うちの子図鑑</small>
          </span>
        </a>

        <nav className="top-nav">
          <a className="nav-link active" href="#characters">
            <BookOpen size={17} />
            キャラクター
          </a>
          <a className="nav-link" href="#worlds">
            <Users size={17} />
            世界観
          </a>
          <a className="nav-link" href="#relations">
            <Network size={17} />
            関係図
          </a>
        </nav>

        <button
          className="add-button"
          onClick={() => setShowRegister(true)}
        >
          <Plus size={18} />
          <span>キャラクター登録</span>
        </button>
      </header>

      {showRegister && (
        <div className="register-overlay">
          <section className="register-card">
            <div className="register-heading">
              <div>
                <p className="eyebrow">NEW CHARACTER</p>
                <h2>
  {editingCharacter ? "キャラクター編集" : "キャラクター登録"}
</h2>
<p>
  {editingCharacter
    ? "キャラクターの情報を変更できます。"
    : "あなたのキャラクターを登録しましょう。"}
</p>
              </div>
              <button
                type="button"
                className="register-close"
                onClick={() => {
  setShowRegister(false);
  setEditingCharacter(null);
}}
              >
                ×
              </button>
            </div>

            <form
              className="register-form"
              onSubmit={(event) => {
                event.preventDefault();

                const formData = new FormData(event.currentTarget);
                const name = formData.get("name").trim();
                const world = formData.get("world").trim();
                const description = formData.get("description").trim();
                const tags = formData
                  .get("tags")
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean);
                const color = formData.get("color");

                
const newCharacter = {
  id: editingCharacter ? editingCharacter.id : Date.now(),
  name,
  world,
  images: editingCharacter
  ? [...editingImages, ...selectedImages]
  : selectedImages,
  author: editingCharacter ? editingCharacter.author : "あなた",
  tags,
  color,
  description,
};

if (editingCharacter) {
  setCharacters((currentCharacters) =>
    currentCharacters.map((character) =>
      character.id === editingCharacter.id
        ? newCharacter
        : character
    )
  );
} else {
  setCharacters((currentCharacters) => [
    ...currentCharacters,
    newCharacter,
  ]);
}

setShowRegister(false);
setEditingCharacter(null);
event.currentTarget.reset();

alert(
  editingCharacter
    ? "キャラクターを更新しました！"
    : "キャラクターを一覧に追加しました！"
);

              }}
            >
              <label>
                キャラクター名 *
                
<input
  type="text"
  name="name"
  placeholder="例：星乃 ルナ"
  defaultValue={editingCharacter?.name || ""}
  required
/>

              </label>

              <label>
                世界観 *
                
<input
  type="text"
  name="world"
  placeholder="例：星屑の魔法学園"
  defaultValue={editingCharacter?.world || ""}
  required
/>

              </label>

              <label>
                キャラクターの紹介
                
<textarea
  name="description"
  rows="4"
  placeholder="性格、設定、物語などを書きましょう"
  defaultValue={editingCharacter?.description || ""}
/>
<label className="form-label">
  キャラクター画像（複数選択できます）
  <input
    type="file"
    name="images"
    accept="image/*"
    multiple
    onChange={handleImageChange}
  />
  {editingImages.length > 0 && (
  <div className="image-preview-list">
    {editingImages.map((image, index) => (
      <div key={`saved-${index}`} style={{ display: "inline-block", margin: "8px" }}>
        <img
          src={image}
          alt={`登録済み画像 ${index + 1}`}
          style={{
            width: "100px",
            height: "120px",
            objectFit: "contain",
            display: "block",
          }}
        />

        <button
          type="button"
          onClick={() => {
            setEditingImages((currentImages) =>
              currentImages.filter((_, currentIndex) => currentIndex !== index)
            );
          }}
        >
          削除
        </button>
      </div>
    ))}
  </div>
)}
    {selectedImages.length > 0 && (
  <div className="image-preview-list">
    {selectedImages.map((image, index) => (
      <div key={index} style={{ display: "inline-block", margin: "8px" }}>
        <img
          src={image}
          alt={`選択した画像 ${index + 1}`}
          style={{
            width: "100px",
            height: "120px",
            objectFit: "contain",
            display: "block",
          }}
        />

        <button
          type="button"
          onClick={() => {
            setSelectedImages((currentImages) =>
              currentImages.filter((_, currentIndex) => currentIndex !== index)
            );
          }}
        >
          削除
        </button>
      </div>
    ))}
  </div>
)}
</label>


              </label>

              <label>
                タグ
                
<input
  type="text"
  name="tags"
  placeholder="例：魔法使い, 学生, 主人公"
  defaultValue={editingCharacter?.tags?.join(", ") || ""}
/>

                <span className="register-hint">
                  タグは「,」で区切って入力できます。
                </span>
              </label>

              <label>
                メインカラー
                
<input
  type="color"
  name="color"
  defaultValue={editingCharacter?.color || "#f1498c"}
/>

              </label>

              <div className="register-actions">
                <button
                  type="button"
                  className="register-cancel"
                  onClick={() => {
  setShowRegister(false);
  setEditingCharacter(null);
}}
                >
                  キャンセル
                </button>
                <button type="submit" className="register-submit">
                  登録する
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selectedCharacter && (
        <div
          className="register-overlay"
          onClick={() => setSelectedCharacter(null)}
        >
          <section
            className="register-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="register-heading">
              <div>
                <p className="eyebrow">CHARACTER PROFILE</p>
                <h2>{selectedCharacter.name}</h2>
                <p>{selectedCharacter.world}</p>
              </div>
              <button
                type="button"
                className="register-close"
                aria-label="詳細を閉じる"
                onClick={() => setSelectedCharacter(null)}
              >
                ×
              </button>
            </div>

            <div
              style={{
                backgroundColor: selectedCharacter.color || "#f1498c",
                color: "#ffffff",
                borderRadius: "16px",
                padding: "28px 20px",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              <UserRound size={64} strokeWidth={1.2} />
              <p style={{ marginBottom: 0 }}>
                NO. {String(selectedCharacter.id).padStart(3, "0")}
              </p>
            </div>

            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <strong>キャラクター名</strong>
                <p>{selectedCharacter.name}</p>
              </div>

              <div>
                <strong>世界観</strong>
                <p>{selectedCharacter.world}</p>
              </div>

              <div>
                <strong>作者</strong>
                <p>{selectedCharacter.author}</p>
              </div>

              <div>
                <strong>キャラクター紹介</strong>
                <p style={{ whiteSpace: "pre-wrap" }}>
                  {selectedCharacter.description || "紹介文はまだありません。"}
                  {selectedCharacter.images?.length > 0 && (
  <div className="character-detail-images">
    {selectedCharacter.images.map((image, index) => (
      <img
        key={index}
        src={image}
        alt={`${selectedCharacter.name}の画像 ${index + 1}`}
        style={{
          maxWidth: "100%",
          width: "240px",
          maxHeight: "320px",
          objectFit: "contain",
          margin: "8px",
        }}
      />
    ))}
  </div>
)}
                </p>
              </div>

              <div>
                <strong>タグ</strong>
                <div className="tag-list">
                  {selectedCharacter.tags.map((tag) => (
                    <span className="tag" key={tag}>
                      #{tag}
                    </span>
                  ))}
                  {selectedCharacter.tags.length === 0 && (
                    <span>タグはまだありません。</span>
                  )}
                </div>
              </div>

              <div>
                <strong>メインカラー</strong>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginTop: "8px",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: selectedCharacter.color || "#f1498c",
                    }}
                  />
                  <span>{selectedCharacter.color || "#f1498c"}</span>
                </div>
              </div>
            </div>

            
<div className="register-actions">
  <button
    type="button"
    className="register-cancel"
    onClick={() => setSelectedCharacter(null)}
  >
    一覧に戻る
  </button>

  <button
    type="button"
    className="register-submit"
    onClick={() => {
  setEditingCharacter(selectedCharacter);
  setEditingImages(selectedCharacter.images || []);
  setSelectedCharacter(null);
  setShowRegister(true);
}}
  >
    
    編集する
  </button>

  <button
    type="button"
    className="register-cancel"
    onClick={() => {
      const confirmed = window.confirm(
        `「${selectedCharacter.name}」を削除しますか？この操作は取り消せません。`
      );

      if (confirmed) {
        setCharacters((currentCharacters) =>
          currentCharacters.filter(
            (character) => character.id !== selectedCharacter.id
          )
        );
        setSelectedCharacter(null);
        alert("キャラクターを削除しました。");
      }
    }}
  >
    削除する
  </button>
</div>


          </section>
        </div>
      )}

      <main id="home">
        <section className="welcome-section">
          <div className="welcome-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              YOUR PRIVATE CHARACTER SPACE
            </div>
            <h1>
              物語の中の、
              <br />
              <span>大切な子たち。</span>
            </h1>
            <p>
              オリジナルキャラクターの設定や関係性を、
              <br className="desktop-break" />
              あなたと仲間だけの場所にまとめよう。
            </p>
            <div className="welcome-actions">
              <a className="primary-button" href="#characters">
                図鑑を見る <BookOpen size={17} />
              </a>
              <span className="private-note">
                <UserRound size={15} />
                招待制のプライベート空間
              </span>
            </div>
          </div>

          <div className="welcome-art" aria-label="キャラクター図鑑の装飾">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-star star-one">✦</div>
            <div className="art-star star-two">✧</div>
            <div className="art-card card-back">
              <Sparkles size={24} />
              <span>YOUR WORLD</span>
            </div>
            <div className="art-card card-front">
              <div className="art-avatar">
                <UserRound size={48} />
              </div>
              <div className="art-line long-line" />
              <div className="art-line short-line" />
              <div className="art-tags">
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="art-sticker">
              MY OCs <span>♥</span>
            </div>
          </div>
        </section>

        <section className="library-section" id="characters">
          <div className="section-heading">
            <div>
              <span className="section-kicker">THE COLLECTION</span>
              <h2>
                キャラクター図鑑 <span>{filteredCharacters.length}</span>
              </h2>
              <p>みんなの大切なキャラクターたち。</p>
            </div>

            <div className="search-box">
              <Search size={18} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="名前・世界観・タグで検索"
                aria-label="キャラクター検索"
              />
              <SlidersHorizontal
                size={17}
                className="search-filter-icon"
              />
            </div>
          </div>

          <div className="filter-row">
            <button className="filter-chip selected">すべて</button>
            <button className="filter-chip">最近追加</button>
            <button className="filter-chip">世界観別</button>
            <span className="result-note">
              {filteredCharacters.length} 人のキャラクター
            </span>
          </div>

          {filteredCharacters.length > 0 ? (
            <div className="character-grid">
              {filteredCharacters.map((character) => (
                <article className="character-card" key={character.id}>
                  <div
                    className="character-art"
                    style={{
                      "--character-color": character.color || "#f1498c",
                    }}
                  >
                    <span className="art-label">CHARACTER FILE</span>
                    <div className="character-placeholder">
  {character.images?.length > 0 ? (
    <img
      src={character.images[0]}
      alt={character.name}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
      }}
    />
  ) : (
    <UserRound size={58} strokeWidth={1.2} />
  )}
</div>
                    <span className="character-number">
                      NO. {String(character.id).padStart(3, "0")}
                    </span>
                  </div>

                  <div className="character-info">
                    <span className="character-world">{character.world}</span>
                    <h3>{character.name}</h3>
                    <p className="character-author">
                      <UserRound size={14} />
                      {character.author}
                    </p>

                    <div className="tag-list">
                      {character.tags.map((tag) => (
                        <span className="tag" key={tag}>
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <button
                      className="details-button"
                      onClick={() => setSelectedCharacter(character)}
                    >
                      プロフィールを見る <span>↗</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search size={30} />
              <p>該当するキャラクターが見つかりませんでした。</p>
              <button onClick={() => setSearch("")}>
                検索をリセット
              </button>
            </div>
          )}
        </section>

        <section className="coming-section" id="worlds">
          <div className="coming-icon">
            <Sparkles size={22} />
          </div>
          <div>
            <span className="section-kicker">YOUR UNIVERSE</span>
            <h2>世界観も、自由に。</h2>
            <p>
              世界観ごとの設定や専用ステータスを管理できる機能を、これから追加します。
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>✦ CHARA LIBRARY</span>
        <span>大切な物語を、大切な仲間と。</span>
      </footer>
    </div>
  );
}
