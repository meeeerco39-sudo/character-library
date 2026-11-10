
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import { toPng } from "html-to-image";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
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
  
  const [session, setSession] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSettingInitialPassword, setIsSettingInitialPassword] = useState(() => {
  const params = new URLSearchParams(window.location.hash.slice(1));
  return params.get("type") === "invite";
});

const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [passwordError, setPasswordError] = useState("");
const [isSettingPassword, setIsSettingPassword] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (error) {
        console.error("ログイン状態の確認に失敗:", error.message);
      }

      setSession(data?.session ?? null);
      setCheckingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setCheckingAuth(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (error) {
        setLoginError(
          "ログインできませんでした。メールアドレスとパスワードを確認してください。"
        );
      }
    } catch {
      setLoginError("通信に失敗しました。接続を確認してください。");
    } finally {
      setIsLoggingIn(false);
    }
  };


    const handleInitialPasswordSetup = async (event) => {
    event.preventDefault();

    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("パスワードは8文字以上にしてください。");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("確認用パスワードが一致しません。");
      return;
    }

    setIsSettingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordError(
          "パスワードを設定できませんでした。招待メールのリンクを開き直してください。"
        );
        return;
      }

      setIsSettingInitialPassword(false);
      setNewPassword("");
      setConfirmPassword("");

      // 招待用のURL情報を取り除く
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    } catch {
      setPasswordError("通信に失敗しました。接続を確認してください。");
    } finally {
      setIsSettingPassword(false);
    }
  };
  
    const [profileTheme, setProfileTheme] = useState(() => {
    return localStorage.getItem("profileTheme") || "pink";
  });
  const exportThemeColor = {
  pink: "#f1498c",
  mint: "#45b89c",
  yellow: "#d5a51b",
  blue: "#429cde",
  lavender: "#9874d8",
}[profileTheme] || "#f1498c";
    useEffect(() => {
    localStorage.setItem("profileTheme", profileTheme);
  }, [profileTheme]);
  
const [colorMode, setColorMode] = useState(() => {
  return localStorage.getItem("colorMode") || "light";
});

useEffect(() => {
  localStorage.setItem("colorMode", colorMode);
}, [colorMode]);

  const [search, setSearch] = useState("");
  const [showCommunityCharacters, setShowCommunityCharacters] = useState(false);
  const [communityCharacters, setCommunityCharacters] = useState([]);
  const [showWorlds, setShowWorlds] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [exportBackground, setExportBackground] = useState("white");
  const exportProfileRef = useRef(null);
  const [selectedWorld, setSelectedWorld] = useState(null);
  // 関係図の状態
const [relationships, setRelationships] = useState([]);
const [showRelationWorldSelect, setShowRelationWorldSelect] = useState(false);
const [selectedRelationWorld, setSelectedRelationWorld] = useState(null);
const [showRelationshipForm, setShowRelationshipForm] = useState(false);
const [editingRelationship, setEditingRelationship] = useState(null);
const [selectedRelationship, setSelectedRelationship] = useState(null);
const [relationshipZoom, setRelationshipZoom] = useState(1);
// 関係の入力フォーム用
const [relationSourceId, setRelationSourceId] = useState("");
const [relationTargetId, setRelationTargetId] = useState("");
const [relationType, setRelationType] = useState("");
const [relationDescription, setRelationDescription] = useState("");
const [relationMemo, setRelationMemo] = useState("");
// 関係データをSupabaseに保存
const saveRelationship = async () => {
  if (!selectedRelationWorld) {
    alert("世界観が選択されていません。");
    return;
  }

  if (!relationSourceId || !relationTargetId) {
    alert("関係するキャラクターを選択してください。");
    return;
  }

  if (relationSourceId === relationTargetId) {
    alert("同じキャラクター同士の関係は登録できません。");
    return;
  }

  if (!relationType.trim()) {
    alert("関係名を入力してください。");
    return;
  }

  const relationshipData = {
    id: editingRelationship?.id ?? crypto.randomUUID(),
    world_id: String(selectedRelationWorld.id),
    source_character_id: String(relationSourceId),
    target_character_id: String(relationTargetId),
    relation_type: relationType.trim(),
    description: relationDescription,
    memo: relationMemo,
    created_by: session.user.id,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("relationships")
    .upsert(relationshipData, { onConflict: "id" });

  if (error) {
    console.error("関係データの保存に失敗しました:", error);
    alert("関係データを保存できませんでした。");
    return;
  }

  setRelationships((current) => {
    const exists = current.some(
      (relation) => String(relation.id) === String(relationshipData.id)
    );

    if (!exists) return [...current, relationshipData];

    return current.map((relation) =>
      String(relation.id) === String(relationshipData.id)
        ? relationshipData
        : relation
    );
  });

  setShowRelationshipForm(false);
  setEditingRelationship(null);
  setRelationSourceId("");
  setRelationTargetId("");
  setRelationType("");
  setRelationDescription("");
  setRelationMemo("");

  alert("関係を保存しました！");
};
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


  


const exportCharacterProfile = async () => {
  if (!exportProfileRef.current || !selectedCharacter) return;

  const target = exportProfileRef.current;

  try {
    await document.fonts.ready;

    const mainImage = target.querySelector(".export-sheet-main-image");

    if (mainImage) {
      await new Promise((resolve, reject) => {
        if (mainImage.complete && mainImage.naturalWidth > 0) {
          resolve();
          return;
        }

        mainImage.onload = resolve;
        mainImage.onerror = reject;
      });
    }

    // 合成前に、メイン画像の位置と大きさを記録する
    const targetRect = target.getBoundingClientRect();
    const imageRect = mainImage?.getBoundingClientRect();

    // プロフィール全体をPNG化する
    const dataUrl = await toPng(target, {
      pixelRatio: 2,
      width: target.scrollWidth,
      height: target.scrollHeight,
      backgroundColor:
        exportBackground === "black" ? "#111111" : "#ffffff",
      cacheBust: false,
      skipAutoScale: true,
      style: {
        position: "static",
        left: "0",
        top: "0",
        transform: "none",
        margin: "0",
      },
    });

    // PNGをキャンバスに読み込む
    const baseImage = new Image();

    await new Promise((resolve, reject) => {
      baseImage.onload = resolve;
      baseImage.onerror = reject;
      baseImage.src = dataUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = baseImage.naturalWidth;
    canvas.height = baseImage.naturalHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("画像合成用のキャンバスを作成できませんでした。");
    }

    // まずプロフィール全体を描画する
    context.drawImage(baseImage, 0, 0);

    // メイン画像だけを別途描画して重ねる
    if (mainImage && imageRect) {
      const scaleX = canvas.width / targetRect.width;
      const scaleY = canvas.height / targetRect.height;

      const inset = 2 * Math.min(scaleX, scaleY);

      const x = (imageRect.left - targetRect.left) * scaleX + inset;
      const y = (imageRect.top - targetRect.top) * scaleY + inset;
      const width = imageRect.width * scaleX - inset * 2;
      const height = imageRect.height * scaleY - inset * 2;

      // 元の object-fit: cover と同じように画像を中央で切り抜く
      const sourceWidth = mainImage.naturalWidth;
      const sourceHeight = mainImage.naturalHeight;
      const sourceRatio = sourceWidth / sourceHeight;
      const destRatio = width / height;

      let sx = 0;
      let sy = 0;
      let sw = sourceWidth;
      let sh = sourceHeight;

      if (sourceRatio > destRatio) {
        sw = sourceHeight * destRatio;
        sx = (sourceWidth - sw) / 2;
      } else {
        sh = sourceWidth / destRatio;
        sy = (sourceHeight - sh) / 2;
      }

      context.save();
      context.beginPath();
      context.rect(x, y, width, height);
      context.clip();

      context.drawImage(
        mainImage,
        sx, sy, sw, sh,
        x, y, width, height
      );

      context.restore();
    }

    // 合成済みキャンバスからPNGを作る
    const finalDataUrl = canvas.toDataURL("image/png");
    const response = await fetch(finalDataUrl);
    const blob = await response.blob();

    const fileName = `${selectedCharacter.name}-設定資料.png`;
    const link = document.createElement("a");
const blobUrl = URL.createObjectURL(blob);

link.download = fileName;
link.href = blobUrl;
document.body.appendChild(link);
link.click();
link.remove();

setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  } catch (error) {
    console.error("PNG保存に失敗しました", error);
    alert("PNG画像を保存できませんでした。もう一度お試しください。");
  }
};


const [dataLoaded, setDataLoaded] = useState(false);
useEffect(() => {
  if (checkingAuth || !session) return;

  let cancelled = false;

  const loadCloudData = async () => {
    try {
      const { data: characterRows, error: characterError } = await supabase
        .from("characters")
.select("id, user_id, data")
        .order("created_at", { ascending: true });

      if (characterError) throw characterError;

      const { data: worldRows, error: worldError } = await supabase
  .from("worlds")
  .select("id, user_id, data")
  .order("created_at", { ascending: true });
      if (worldError) throw worldError;
      const { data: relationshipRows, error: relationshipError } = await supabase
  .from("relationships")
  .select("*")
  .order("created_at", { ascending: true });

if (relationshipError) throw relationshipError;

      if (cancelled) return;

     const allCharacters = (characterRows || []).map((row) => ({
  ...row.data,
  id: row.data?.id ?? row.id,
  user_id: row.user_id,
}));

setCharacters(
  allCharacters.filter(
    (character) => character.user_id === session.user.id
  )
);

setCommunityCharacters(allCharacters);

      setWorlds(
  (worldRows || []).map((row) => ({
    ...row.data,
    id: row.data?.id ?? row.id,
    user_id: row.user_id,
  }))
);
      setRelationships(relationshipRows || []);
    } catch (error) {
      console.error("Supabaseからの読み込みに失敗しました:", error);
      alert("共有データを読み込めませんでした。通信状態を確認してください。");
    } finally {
      if (!cancelled) setDataLoaded(true);
    }
  };

  loadCloudData();

  return () => {
    cancelled = true;
  };
}, [checkingAuth, session]);

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
  if (!dataLoaded) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
  } catch (error) {
    console.error("キャラクターを保存できませんでした", error);
  }
}, [characters, dataLoaded]);

// キャラクターをSupabaseにも保存
useEffect(() => {
  if (!dataLoaded || !session?.user?.id) return;

  // 自分が所有しているキャラクターだけを保存する
  const myCharacters = characters.filter(
    (character) => character.user_id === session.user.id
  );

  if (myCharacters.length === 0) return;

  const saveCharactersToCloud = async () => {
    const rows = myCharacters.map((character) => ({
      id: String(character.id),
      user_id: character.user_id,
      data: character,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("characters")
      .upsert(rows, { onConflict: "id" });

    if (error) {
      console.error("キャラクターのクラウド保存に失敗しました:", error);
    } else {
      console.log("キャラクターをSupabaseに保存しました");
    }
  };

  saveCharactersToCloud();
}, [characters, dataLoaded, session]);


  // 世界観データはキャラクターとは別に保存します。
  // 初回は、既存キャラクターに登録されている世界観名から作成します。
  const [worlds, setWorlds] = useState(() => {
  try {
    const savedWorlds = localStorage.getItem("character-library-worlds");
    return savedWorlds ? JSON.parse(savedWorlds) : [];
  } catch (error) {
    console.error("世界観データを読み込めませんでした", error);
    return [];
  }
});
      
  const [showWorldForm, setShowWorldForm] = useState(false);
  const [editingWorldId, setEditingWorldId] = useState(null);
  const [worldTermDrafts, setWorldTermDrafts] = useState([]);
  const [worldCharacterIds, setWorldCharacterIds] = useState([]);

 useEffect(() => {
  if (!dataLoaded) return;

  try {
    localStorage.setItem("character-library-worlds", JSON.stringify(worlds));
  } catch (error) {
    console.error("世界観を保存できませんでした", error);
  }
}, [worlds, dataLoaded]);

// 世界観をSupabaseにも保存
useEffect(() => {
  if (!dataLoaded || !session?.user?.id) return;

  // 自分が作成した世界観だけ保存する
  const myWorlds = worlds.filter(
    (world) => world.user_id === session.user.id
  );

  if (myWorlds.length === 0) return;

  const saveWorldsToCloud = async () => {
    const rows = myWorlds.map((world) => ({
      id: String(world.id),
      user_id: world.user_id,
      data: world,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("worlds")
      .upsert(rows, { onConflict: "id" });

    if (error) {
      console.error("世界観のクラウド保存に失敗しました:", error);
    } else {
      console.log("世界観をSupabaseに保存しました");
    }
  };

  saveWorldsToCloud();
}, [worlds, dataLoaded, session]);

  const openWorldForm = (world = null) => {
    setEditingWorldId(world?.id ?? null);
    setWorldTermDrafts(world?.terms?.length
      ? world.terms.map((term) => ({ ...term }))
      : []);
    setWorldCharacterIds(world ? (world.characterIds || []) : []);
    setShowWorldForm(true);
  };

  const saveWorld = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("worldName") || "").trim();
    const description = String(formData.get("worldDescription") || "").trim();
    if (!name) return;

    
    const nextWorld = {
  id: editingWorldId || `world-${Date.now()}`,
  user_id: editingWorldId
    ? worlds.find((world) => String(world.id) === String(editingWorldId))?.user_id ?? session.user.id
    : session.user.id,
  name,
  description,
  terms,
  characterIds
};
    setWorlds((current) => {
      const withoutMovedCharacters = current.map((world) => {
        if (world.id === editingWorldId) return nextWorld;
        return {
          ...world,
          characterIds: (world.characterIds || []).filter(
            (id) => !worldCharacterIds.includes(id)
          ),
        };
      });
      return editingWorldId
        ? withoutMovedCharacters
        : [...withoutMovedCharacters, nextWorld];
    });

    

    setShowWorldForm(false);
    setEditingWorldId(null);
  };

  const deleteWorld = async (world) => {
  if (!window.confirm(`「${world.name}」を削除しますか？
世界観の説明・用語データが削除されます。キャラクター本体は削除されません。`)) return;

  const { error } = await supabase
    .from("worlds")
    .delete()
    .eq("id", String(world.id));

  if (error) {
    console.error("世界観の削除に失敗しました:", error);
    alert("世界観の削除に失敗しました。もう一度お試しください。");
    return;
  }

  setWorlds((current) =>
    current.filter((item) => String(item.id) !== String(world.id))
  );


  alert("世界観を削除しました。");
};

   // ほかのメンバーの変更をリアルタイムで受信
useEffect(() => {
  if (!dataLoaded || !session?.user?.id) return;

  const channel = supabase
    .channel("shared-library-changes")

    // キャラクターの変更を受信
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "characters",
      },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const deletedId = String(payload.old.id);

          setCharacters((current) =>
            current.filter(
              (character) => String(character.id) !== deletedId
            )
          );

          setCommunityCharacters((current) =>
            current.filter(
              (character) => String(character.id) !== deletedId
            )
          );

          return;
        }

        const newCharacter = {
          ...payload.new.data,
          id: payload.new.data?.id ?? payload.new.id,
          user_id: payload.new.user_id,
        };

        setCommunityCharacters((current) => {
          const exists = current.some(
            (character) =>
              String(character.id) === String(newCharacter.id)
          );

          if (!exists) return [...current, newCharacter];

          return current.map((character) =>
            String(character.id) === String(newCharacter.id)
              ? newCharacter
              : character
          );
        });

        if (newCharacter.user_id === session.user.id) {
          setCharacters((current) => {
            const exists = current.some(
              (character) =>
                String(character.id) === String(newCharacter.id)
            );

            if (!exists) return [...current, newCharacter];

            return current.map((character) =>
              String(character.id) === String(newCharacter.id)
                ? newCharacter
                : character
            );
          });
        }
      }
    )

    // 世界観の変更を受信
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "worlds",
      },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const deletedId = String(payload.old.id);

          setWorlds((current) =>
            current.filter(
              (world) => String(world.id) !== deletedId
            )
          );
          return;
        }

        const newWorld = {
          ...payload.new.data,
          id: payload.new.data?.id ?? payload.new.id,
          user_id: payload.new.user_id,
        };

        setWorlds((current) => {
          const exists = current.some(
            (world) => String(world.id) === String(newWorld.id)
          );

          if (!exists) return [...current, newWorld];

          return current.map((world) =>
            String(world.id) === String(newWorld.id)
              ? newWorld
              : world
          );
        });
      }
    )

    // 関係データの変更を受信
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "relationships",
      },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const deletedId = String(payload.old.id);

          setRelationships((current) =>
            current.filter(
              (relation) => String(relation.id) !== deletedId
            )
          );
          return;
        }

        const newRelation = payload.new;

        setRelationships((current) => {
          const exists = current.some(
            (relation) =>
              String(relation.id) === String(newRelation.id)
          );

          if (!exists) return [...current, newRelation];

          return current.map((relation) =>
            String(relation.id) === String(newRelation.id)
              ? newRelation
              : relation
          );
        });
      }
    )

    .subscribe((status) => {
      console.log("リアルタイム同期:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, [dataLoaded, session]);

// 選択中の世界観に所属するキャラクター
const relationCharacters = selectedRelationWorld
  ? characters.filter((character) =>
      (selectedRelationWorld.characterIds || []).some(
        (id) => String(id) === String(character.id)
      )
    )
  : [];
  
  // 選択中の世界観に属する関係データ
const relationMapRelationships = selectedRelationWorld
  ? relationships.filter(
      (relation) =>
        String(relation.world_id) === String(selectedRelationWorld.id)
    )
  : [];

  const filteredCharacters = characters.filter((character) => {
    const keyword = search.toLowerCase();

    return (
      character.name.toLowerCase().includes(keyword) ||
      character.world.toLowerCase().includes(keyword) ||
      character.tags.some((tag) => tag.toLowerCase().includes(keyword))
    );
  });

  
  if (checkingAuth) {
    return <div className="loading-screen">ログイン状態を確認しています...</div>;
  }
  if (session && isSettingInitialPassword) {
    return (
      <div className="login-screen">
        <form
          className="login-form"
          onSubmit={handleInitialPasswordSetup}
        >
          <h1>うちの子図鑑</h1>
          <p>初回パスワード設定</p>
          <p>これから使用するパスワードを設定してください。</p>

          <label htmlFor="new-password">新しいパスワード</label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />

          <label htmlFor="confirm-password">パスワード（確認用）</label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />

          {passwordError && (
            <p role="alert">{passwordError}</p>
          )}

          <button type="submit" disabled={isSettingPassword}>
            {isSettingPassword
              ? "設定中..."
              : "パスワードを設定する"}
          </button>
        </form>
      </div>
    );
  }


  if (!session) {
    return (
      <div className="login-screen">
        <form className="login-form" onSubmit={handleLogin}>
          <h1>うちの子図鑑</h1>
          <p>招待されたメンバー専用</p>

          <label htmlFor="login-email">メールアドレス</label>
          <input
            id="login-email"
            type="email"
            value={loginEmail}
            onChange={(event) => setLoginEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="login-password">パスワード</label>
          <input
            id="login-password"
            type="password"
            value={loginPassword}
            onChange={(event) => setLoginPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          {loginError && <p role="alert">{loginError}</p>}

          <button type="submit" disabled={isLoggingIn}>
            {isLoggingIn ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </div>
    );
  }


  return (
<div className={`app-shell ${colorMode === "dark" ? "dark-mode" : "light-mode"}`}>
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
         <button
  type="button"
  className={`nav-link ${!showCommunityCharacters && !showWorlds ? "active" : ""}`}
    onClick={() => {
  setShowCommunityCharacters(false);
  setShowWorlds(false);
  setSelectedCharacter(null);
  setSelectedWorld(null);
}}
>
  <BookOpen size={17} />
  キャラクター
</button>
<button
  type="button"
  className={`nav-link ${showCommunityCharacters ? "active" : ""}`}
  onClick={() => {
  setShowCommunityCharacters(true);
  setShowWorlds(false);
  setSelectedCharacter(null);
  setSelectedWorld(null);
}}
>
  <Users size={17} />
  みんなのキャラクター
</button>
          <button
  type="button"
  className={`nav-link ${showWorlds ? "active" : ""}`}
 onClick={() => {
  setShowCommunityCharacters(false);
  setShowWorlds(true);
  setSelectedCharacter(null);
  setSelectedWorld(null);
}}
>
  <Users size={17} />
  世界観
</button>
          <button
  type="button"
  className="nav-link"
 onClick={() => {
  setShowCommunityCharacters(false);
  setShowWorlds(false);
  setSelectedCharacter(null);
  setSelectedWorld(null);
  setSelectedRelationWorld(null);
  setShowRelationshipForm(false);
  setEditingRelationship(null);
  setShowRelationWorldSelect(true);
}}
>
  <Network size={17} />
  関係図
</button>
        </nav>

        

<div className="header-actions">
  <div className="theme-menu-wrap">
    
<div className="color-mode-toggle" aria-label="画面モード">
  <button
    type="button"
    className={colorMode === "light" ? "active" : ""}
    onClick={() => setColorMode("light")}
    aria-pressed={colorMode === "light"}
  >
     ライト
  </button>

  <button
    type="button"
    className={colorMode === "dark" ? "active" : ""}
    onClick={() => setColorMode("dark")}
    aria-pressed={colorMode === "dark"}
  >
     ダーク
  </button>
</div>

    <button
      className="theme-color-toggle"
      onClick={() =>
        setShowThemeSettings((current) => !current)
      }
      title="テーマカラーを変更"
      aria-label="テーマカラーを変更"
      aria-expanded={showThemeSettings}
    >
      <span> テーマカラー</span>
    </button>

    {showThemeSettings && (
      <div className="profile-theme-settings">
        <label htmlFor="profile-theme-select">
          プロフィールカラー
        </label>

        <select
          id="profile-theme-select"
          value={profileTheme}
          onChange={(event) =>
            setProfileTheme(event.target.value)
          }
        >
          <option value="pink"> ピンク＆ライム</option>
          <option value="mint"> ミント</option>
          <option value="yellow"> バターイエロー</option>
          <option value="blue"> スカイブルー</option>
          <option value="lavender"> ラベンダー</option>
        </select>
      </div>
    )}
  </div>

  <button
    className="add-button"
    onClick={() => setShowRegister(true)}
  >
    <Plus size={18} />
    <span>キャラクター登録</span>
  </button>
</div>
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
                const age = formData.get("age").trim();
const gender = formData.get("gender").trim();
const height = formData.get("height").trim();
const species = formData.get("species").trim();
const affiliation = formData.get("affiliation").trim();
const firstPerson = formData.get("firstPerson").trim();
const secondPerson = formData.get("secondPerson").trim();
const likes = formData.get("likes").trim();
const dislikes = formData.get("dislikes").trim();
const sampleVoice = formData.get("sampleVoice").trim();

                
const newCharacter = {
  id: editingCharacter ? editingCharacter.id : Date.now(),
  user_id: editingCharacter?.user_id ?? session.user.id,
  name,
  world,
  age,
  gender,
  height,
  species,
  affiliation,
  knowledge: Number(formData.get("knowledge") || 0),
  madness: Number(formData.get("madness") || 0),
  sociability: Number(formData.get("sociability") || 0),
  mentality: Number(formData.get("mentality") || 0),
  stamina: Number(formData.get("stamina") || 0),
  talkativeness: Number(formData.get("talkativeness") || 0),
  firstPerson,
  secondPerson,
  likes,
  dislikes,
  sampleVoice,
  images: editingCharacter
  ? [...editingImages, ...selectedImages]
  : selectedImages,
  author: editingCharacter
  ? editingCharacter.author
  : (session.user.user_metadata?.display_name ||
     session.user.user_metadata?.name ||
     "メンバー"),
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
              </label>

              <label>
                年齢
                <input
                  type="text"
                  name="age"
                  placeholder="例：17歳、約200歳"
                  defaultValue={editingCharacter?.age || ""}
                />
              </label>

              <label>
                性別
                <input
                  type="text"
                  name="gender"
                  placeholder="例：女性、男性、不明"
                  defaultValue={editingCharacter?.gender || ""}
                />
              </label>

              <label>
                身長
                <input
                  type="text"
                  name="height"
                  placeholder="例：160cm"
                  defaultValue={editingCharacter?.height || ""}
                />
              </label>

              <label>
                種族
                <input
                  type="text"
                  name="species"
                  placeholder="例：人間、エルフ"
                  defaultValue={editingCharacter?.species || ""}
                />
              </label>

              <label>
                所属
                <input
                  type="text"
                  name="affiliation"
                  placeholder="例：星屑の魔法学園"
                  defaultValue={editingCharacter?.affiliation || ""}
                />
              </label>

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



              <div className="stat-inputs">
                <h3>キャラクターステータス（0〜10）</h3>

                <label>
                  知識
                  <input
                    type="number"
                    name="knowledge"
                    min="0"
                    max="10"
                    defaultValue={editingCharacter?.knowledge ?? 0}
                  />
                </label>

                <label>
                  狂気
                  <input
                    type="number"
                    name="madness"
                    min="0"
                    max="10"
                    defaultValue={editingCharacter?.madness ?? 0}
                  />
                </label>

                <label>
                  社交性
                  <input
                    type="number"
                    name="sociability"
                    min="0"
                    max="10"
                    defaultValue={editingCharacter?.sociability ?? 0}
                  />
                </label>

                <label>
                  精神力
                  <input
                    type="number"
                    name="mentality"
                    min="0"
                    max="10"
                    defaultValue={editingCharacter?.mentality ?? 0}
                  />
                </label>

                <label>
                  体力
                  <input
                    type="number"
                    name="stamina"
                    min="0"
                    max="10"
                    defaultValue={editingCharacter?.stamina ?? 0}
                  />
                </label>

                <label>
                  お喋り
                  <input
                    type="number"
                    name="talkativeness"
                    min="0"
                    max="10"
                    defaultValue={editingCharacter?.talkativeness ?? 0}
                  />
                </label>
              </div>
             <label>
  一人称
  <input
    type="text"
    name="firstPerson"
    placeholder="例：私、僕、俺"
    defaultValue={editingCharacter?.firstPerson || ""}
  />
</label>

<label>
  二人称
  <input
    type="text"
    name="secondPerson"
    placeholder="例：あなた、君、お前"
    defaultValue={editingCharacter?.secondPerson || ""}
  />
</label>

<label>
  好きなもの
  <textarea
    name="likes"
    rows="2"
    placeholder="好きな食べ物、趣味など"
    defaultValue={editingCharacter?.likes || ""}
  />
</label>

<label>
  苦手なもの
  <textarea
    name="dislikes"
    rows="2"
    placeholder="苦手なもの、嫌いなものなど"
    defaultValue={editingCharacter?.dislikes || ""}
  />
</label>


<label>
  サンプルボイス
  <textarea
    name="sampleVoice"
    rows="4"
    placeholder="例：『初めまして。俺は〇〇だ。よろしくな』"
    defaultValue={editingCharacter?.sampleVoice || ""}
  />
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
  className="register-card character-detail"
  data-profile-theme={profileTheme}
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


<div className="character-detail-groups">
<div className="character-meta-row">
  <div className="character-detail-meta">
    <strong>世界観</strong>
    <p>{selectedCharacter.world || "未設定"}</p>
  </div>

  <div className="character-detail-meta">
    <strong>作者</strong>
    <p>{selectedCharacter.author || "未設定"}</p>
  </div>

  <div className="character-detail-meta">
    <strong>ID</strong>
    <p>{selectedCharacter.id || "未設定"}</p>
  </div>
</div>

<div className="character-profile-chips">
  {[
    ["年齢", selectedCharacter.age],
    ["性別", selectedCharacter.gender],
    ["身長", selectedCharacter.height],
    ["所属", selectedCharacter.affiliation],
    ["種族", selectedCharacter.species],
  ].map(([label, value]) => (
    <span className="character-profile-chip" key={label}>
      {label}：{value || "未設定"}
    </span>
  ))}
</div>


                           
<div className="character-description-card">
  <div className="character-section-heading">
    <span className="character-section-icon">✦</span>
    <strong>キャラクター紹介</strong>
  </div>

  <p className="character-description-text">
    {selectedCharacter.description || "紹介文はまだありません。"}
  </p>

  {selectedCharacter.images?.length > 0 && (
    <>
      <div className="character-description-divider" />
      <div className="character-detail-images">
        {selectedCharacter.images.map((image, index) => (
          <img
            key={index}
            src={image}
            alt={`${selectedCharacter.name}の画像 ${index + 1}`}
          />
        ))}
      </div>
    </>
  )}
</div>


              
<div className="character-status-intro-row">
  <div className="character-radar-chart">
    <strong>ステータス</strong>
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart
  margin={{ top: 25, right: 45, bottom: 40, left: 45 }}
  data={[
          { subject: "知識", value: selectedCharacter.knowledge ?? 0 },
          { subject: "狂気", value: selectedCharacter.madness ?? 0 },
          { subject: "社交性", value: selectedCharacter.sociability ?? 0 },
          { subject: "精神力", value: selectedCharacter.mentality ?? 0 },
          { subject: "体力", value: selectedCharacter.stamina ?? 0 },
          { subject: "お喋り", value: selectedCharacter.talkativeness ?? 0 },
        ]}
        outerRadius="75%"
      >
        <PolarGrid />
        
<PolarAngleAxis
  dataKey="subject"
  tick={({ x, y, payload, textAnchor, fill }) => (
    <text
      x={x}
      y={payload.value === "精神力" ? y + 10 : y}
      textAnchor={textAnchor}
      fill={fill}
      fontSize={14}
    >
      {payload.value}
    </text>
  )}
/>

        <PolarRadiusAxis domain={[0, 10]} />
        <Radar
  name="ステータス"
  dataKey="value"
  stroke={
    {
      pink: "#f1498c",
      mint: "#45b89c",
      yellow: "#d5a51b",
      blue: "#429cde",
      lavender: "#9874d8",
    }[profileTheme] || "#f1498c"
  }
  fill={
    {
      pink: "#f1498c",
      mint: "#45b89c",
      yellow: "#d5a51b",
      blue: "#429cde",
      lavender: "#9874d8",
    }[profileTheme] || "#f1498c"
  }
  fillOpacity={0.55}
  dot={false}
/>
      </RadarChart>
    </ResponsiveContainer>
  </div>

  <div className="character-intro-details">
    <div className="character-speech-row">
      <div className="character-info-card">
        <strong>一人称</strong>
        <p>{selectedCharacter.firstPerson || "未設定"}</p>
      </div>

      <div className="character-info-card">
        <strong>二人称</strong>
        <p>{selectedCharacter.secondPerson || "未設定"}</p>
      </div>
    </div>

    <div className="character-info-card">
      <strong>好きなもの</strong>
      <p style={{ whiteSpace: "pre-wrap" }}>
        {selectedCharacter.likes || "未設定"}
      </p>
    </div>

    <div className="character-info-card">
      <strong>苦手なもの</strong>
      <p style={{ whiteSpace: "pre-wrap" }}>
        {selectedCharacter.dislikes || "未設定"}
      </p>
    </div>
  </div>
</div>



              
<div className="character-info-card character-sample-voice">
  <strong>🎙️ サンプルボイス</strong>
  <p style={{ whiteSpace: "pre-wrap" }}>
    {selectedCharacter.sampleVoice || "サンプルボイスはまだありません。"}
  </p>
</div>


                
<div className="character-bottom-profile">
  <div className="character-bottom-card">
    <strong>🏷️ タグ</strong>
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

  <div className="character-bottom-card">
    <strong>🎨 メインカラー</strong>
    <div className="character-main-color">
      <span
        className="character-main-color-swatch"
        style={{
          backgroundColor: selectedCharacter.color || "#f1498c",
        }}
      />
      <span>{selectedCharacter.color || "#f1498c"}</span>
    </div>
  </div>
</div>

          
<div
  ref={exportProfileRef}
  className="export-profile-sheet"
  style={{
  position: "absolute",
  width: "720px",
  backgroundColor:
    exportBackground === "black" ? "#111111" : "#ffffff",
  color: exportBackground === "black" ? "#f5f5f5" : "#242424",
  "--export-accent": exportThemeColor,
}}
>

            

<header className="export-sheet-header">
  {selectedCharacter.images?.[0] && (
    <img
      className="export-sheet-main-image"
      src={selectedCharacter.images[0]}
      alt={`${selectedCharacter.name}の画像`}
    />
  )}

  <div className="export-sheet-header-text">
    <div className="export-sheet-title-block">
      <p className="export-sheet-eyebrow">CHARACTER PROFILE</p>
      <h2>{selectedCharacter.name}</h2>

      <div className="export-sheet-meta-row">
        <span>世界観：{selectedCharacter.world || "未設定"}</span>
        <span>作者：{selectedCharacter.author || "未設定"}</span>
      </div>
    </div>

    <div className="export-sheet-header-info">
      <div className="export-sheet-basic-info">
        <span>年齢：{selectedCharacter.age || "未設定"}</span>
        <span>性別：{selectedCharacter.gender || "未設定"}</span>
        <span>身長：{selectedCharacter.height || "未設定"}</span>
      </div>

      <div className="export-sheet-profile-grid">
        <p>
          <strong>所属：</strong>
          <span>{selectedCharacter.affiliation || "未設定"}</span>
        </p>
        <p>
          <strong>種族：</strong>
          <span>{selectedCharacter.species || "未設定"}</span>
        </p>
        <p>
          <strong>一人称：</strong>
          <span>{selectedCharacter.firstPerson || "未設定"}</span>
        </p>
        <p>
          <strong>二人称：</strong>
          <span>{selectedCharacter.secondPerson || "未設定"}</span>
        </p>
      </div>
    </div>
  </div>
</header>



            <section className="export-sheet-section">
              <h3>キャラクター紹介</h3>
              <p className="export-sheet-long-text">
                {selectedCharacter.description || "紹介文はまだありません。"}
              </p>
            </section>

            {selectedCharacter.images?.length > 1 && (
              <section className="export-sheet-section">
                <h3>その他の画像</h3>
                <div className="export-sheet-image-gallery">
                  {selectedCharacter.images.slice(1).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${selectedCharacter.name}の画像 ${index + 2}`}
                    />
                  ))}
                </div>
              </section>
            )}

            
<div className="export-sheet-bottom-row">
  <section className="export-sheet-section export-sheet-status">
    <h3>ステータス</h3>
    <RadarChart
      width={320}
      height={240}
      data={[
        { subject: "知識", value: selectedCharacter.knowledge ?? 0 },
        { subject: "狂気", value: selectedCharacter.madness ?? 0 },
        { subject: "社交性", value: selectedCharacter.sociability ?? 0 },
        { subject: "精神力", value: selectedCharacter.mentality ?? 0 },
        { subject: "体力", value: selectedCharacter.stamina ?? 0 },
        { subject: "お喋り", value: selectedCharacter.talkativeness ?? 0 },
      ]}
    >
      <PolarGrid />
      <PolarAngleAxis dataKey="subject" />
      <PolarRadiusAxis domain={[0, 10]} />
      <Radar
        name="ステータス"
        dataKey="value"
        stroke={exportThemeColor}
        fill={exportThemeColor}
        fillOpacity={0.45}
      />
    </RadarChart>
  </section>

  <section className="export-sheet-section export-sheet-likes-dislikes">
    <div>
      <h3>好きなもの</h3>
      <p className="export-sheet-long-text">
        {selectedCharacter.likes || "未設定"}
      </p>
    </div>
    <div>
      <h3>苦手なもの</h3>
      <p className="export-sheet-long-text">
        {selectedCharacter.dislikes || "未設定"}
      </p>
    </div>
  </section>
</div>


            <section className="export-sheet-section">
              <h3>サンプルボイス</h3>
              <p className="export-sheet-long-text">
                {selectedCharacter.sampleVoice || "サンプルボイスはまだありません。"}
              </p>
            </section>
          </div>

            </div>

          <div className="png-export-controls">
  <label>
    PNGの背景
    <select
      value={exportBackground}
      onChange={(event) => setExportBackground(event.target.value)}
    >
      <option value="white">白</option>
      <option value="black">黒</option>
    </select>
  </label>

  <button
    type="button"
    className="register-submit"
    onClick={exportCharacterProfile}
  >
    PNGで保存
  </button>
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
    onClick={async () => {
      const confirmed = window.confirm(
        `「${selectedCharacter.name}」を削除しますか？この操作は取り消せません。`
      );

      if (confirmed) {
  const characterId = String(selectedCharacter.id);

console.log("削除対象:", selectedCharacter);
console.log("ログイン中のユーザーID:", session.user.id);
console.log("キャラクターの所有者ID:", selectedCharacter.user_id);

  const { data: deletedRows, error } = await supabase
  .from("characters")
  .delete()
  .eq("id", String(characterId))
  .eq("user_id", session.user.id)
  .select("id");

console.log("削除結果:", deletedRows);
console.log("削除エラー:", error);

if (error) {
  console.error("キャラクターの削除に失敗しました:", error);
  alert("キャラクターの削除に失敗しました。");
  return;
}

if (!deletedRows || deletedRows.length === 0) {
  console.error("削除対象が見つからないか、削除権限がありません。");
  alert("削除できませんでした。自分が登録したキャラクターか確認してください。");
  return;
}

// 自分のキャラクター一覧から削除
setCharacters((current) =>
  current.filter(
    (character) => String(character.id) !== String(characterId)
  )
);

// 共有キャラクター一覧からも削除
setCommunityCharacters((current) =>
  current.filter(
    (character) => String(character.id) !== String(characterId)
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

        {!showCommunityCharacters && !showWorlds && (
          

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
                      {(character.tags || []).map((tag) => (
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

        )}

{showCommunityCharacters && (
  <section className="library-section" id="community-characters">
    <div className="section-heading">
      <div>
        <span className="section-kicker">COMMUNITY COLLECTION</span>
        <h2>
          みんなのキャラクター
          <span>{communityCharacters.length}</span>
        </h2>
        <p>メンバーみんなのキャラクターを見てみましょう。</p>
      </div>
    </div>

    {communityCharacters.length > 0 ? (
      <div className="character-grid">
        {communityCharacters.map((character) => (
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
                {character.author || "作者不明"}
              </p>

              <div className="tag-list">
                {(character.tags || []).map((tag) => (
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
        <Users size={30} />
        <p>まだキャラクターが登録されていません。</p>
      </div>
    )}
  </section>
)}

        {showWorlds && (
  <section className="worlds-section" id="worlds">
          <div className="section-heading world-section-heading">
            <div>
              <span className="section-kicker">YOUR UNIVERSE</span>
              <h2>世界観一覧 <span>{worlds.length}</span></h2>
              <p>物語の舞台や設定、用語をまとめて管理できます。</p>
            </div>
            <button type="button" className="add-button" onClick={() => openWorldForm()}>
              <Plus size={18} /> <span>世界観を登録</span>
            </button>
          </div>

          {showWorldForm && (
            <form className="world-form-card" onSubmit={saveWorld}>
              <div className="register-heading">
                <div>
                  <p className="eyebrow">WORLD SETTING</p>
                  <h3>{editingWorldId ? "世界観を編集" : "新しい世界観"}</h3>
                </div>
                <button type="button" className="register-close" onClick={() => setShowWorldForm(false)} aria-label="閉じる">×</button>
              </div>
              <label className="world-field">
                世界観名 *
                <input name="worldName" required defaultValue={worlds.find((world) => world.id === editingWorldId)?.name || ""} placeholder="例：星屑の魔法学園" />
              </label>
              <label className="world-field">
                説明
                <textarea name="worldDescription" rows="4" defaultValue={worlds.find((world) => world.id === editingWorldId)?.description || ""} placeholder="世界の成り立ち、雰囲気、舞台など" />
              </label>

              <div className="world-field">
                <div className="world-subheading">
                  <strong>用語説明</strong>
                  <button type="button" className="world-small-button" onClick={() => setWorldTermDrafts((current) => [...current, { id: `term-${Date.now()}`, name: "", description: "" }])}><Plus size={15} /> 用語を追加</button>
                </div>
                {worldTermDrafts.length === 0 && <p className="world-muted">用語があれば「用語を追加」から登録できます。</p>}
                {worldTermDrafts.map((term, index) => (
                  <div className="world-term-editor" key={term.id || index}>
                    <input aria-label="用語名" value={term.name} onChange={(event) => setWorldTermDrafts((current) => current.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} placeholder="用語名" />
                    <textarea aria-label="用語の説明" rows="2" value={term.description} onChange={(event) => setWorldTermDrafts((current) => current.map((item, i) => i === index ? { ...item, description: event.target.value } : item))} placeholder="用語の説明" />
                    <button type="button" className="world-remove-button" onClick={() => setWorldTermDrafts((current) => current.filter((_, i) => i !== index))}>削除</button>
                  </div>
                ))}
              </div>

              <div className="world-field">
                <strong>この世界観に紐づけるキャラクター</strong>
                <p className="world-muted">選んだキャラクターのプロフィールにある世界観名も更新されます。</p>
                {characters.length === 0 ? <p className="world-muted">先にキャラクターを登録してください。</p> : (
                  <div className="world-character-picker">
                    {characters.map((character) => (
                      <label className="world-character-option" key={character.id}>
                        <input type="checkbox" checked={worldCharacterIds.includes(character.id)} onChange={(event) => setWorldCharacterIds((current) => event.target.checked ? [...current, character.id] : current.filter((id) => id !== character.id))} />
                        <span>{character.name}</span>
                        <small>{character.world || "世界観未設定"}</small>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="register-actions">
                <button type="button" className="register-cancel" onClick={() => setShowWorldForm(false)}>キャンセル</button>
                <button type="submit" className="register-submit">保存する</button>
              </div>
            </form>
          )}

          {worlds.length > 0 ? (
            <div className="world-card-grid">
              {worlds.map((world) => {
                const linkedCharacters = characters.filter((character) => (world.characterIds || []).includes(character.id));
                return (
                  <article
  className="world-card"
  key={world.id}
  onClick={() => setSelectedWorld(world)}
  role="button"
  tabIndex={0}
  onKeyDown={(event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedWorld(world);
    }
  }}
>
                    <div className="world-card-top"><span className="world-card-icon"><BookOpen size={21} /></span><span className="world-character-count">{linkedCharacters.length} 人</span></div>
                    <h3>{world.name}</h3>
                    <p className="world-card-description">{world.description || "説明はまだ登録されていません。"}</p>
                    <div className="world-card-meta">用語 {world.terms?.length || 0} 件 ・ キャラクター {linkedCharacters.length} 人</div>
                    {world.terms?.length > 0 && <div className="world-term-list"><strong>用語</strong>{world.terms.map((term, index) => <div className="world-term-item" key={term.id || index}><b>{term.name || "名称未設定"}</b><p>{term.description || "説明なし"}</p></div>)}</div>}
                    {linkedCharacters.length > 0 && <div className="world-linked-characters"><strong>所属キャラクター</strong><p>{linkedCharacters.map((character) => character.name).join("、")}</p></div>}
                    <div className="world-card-actions"><button type="button" className="world-small-button" onClick={() => openWorldForm(world)}>編集</button><button type="button" className="world-small-button danger" onClick={() => deleteWorld(world)}>削除</button></div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="world-empty-state"><BookOpen size={30} /><h3>世界観はまだありません</h3><p>「世界観を登録」から、物語の舞台を作成しましょう。</p></div>
                    )}
        </section>
        )}
      </main>

      
      {selectedWorld && (
        <div
          className="world-modal-overlay"
          onClick={() => setSelectedWorld(null)}
        >
          <section
            className="world-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="world-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="world-modal-close"
              onClick={() => setSelectedWorld(null)}
              aria-label="閉じる"
            >
              ×
            </button>

            <div className="world-detail-header">
              <span className="section-kicker">WORLD PROFILE</span>
              <h2 id="world-detail-title">{selectedWorld.name}</h2>
              <p>
                {selectedWorld.description || "説明はまだ登録されていません。"}
              </p>
            </div>

            <div className="world-detail-columns">
              <section className="world-detail-panel">
                <h3>所属キャラクター</h3>
                {(selectedWorld.characterIds || []).length > 0 ? (
                  characters
                    .filter((character) =>
                      (selectedWorld.characterIds || []).includes(character.id)
                    )
                    .map((character) => (
                      <button
                        type="button"
                        className="world-detail-character"
                        key={character.id}
                        onClick={() => {
                          setSelectedWorld(null);
                          setSelectedCharacter(character);
                        }}
                      >
                        {character.name}
                        <span>プロフィールを見る →</span>
                      </button>
                    ))
                ) : (
                  <p className="world-muted">所属キャラクターはまだいません。</p>
                )}
              </section>

              <section className="world-detail-panel world-detail-description">
                <h3>世界観について</h3>
                <p>
                  {selectedWorld.description || "説明はまだ登録されていません。"}
                </p>
              </section>

              <section className="world-detail-panel">
                <h3>用語集</h3>
                {(selectedWorld.terms || []).length > 0 ? (
                  selectedWorld.terms.map((term, index) => (
                    <article className="world-detail-term" key={term.id || index}>
                      <h4>{term.name || "名称未設定"}</h4>
                      <p>{term.description || "説明なし"}</p>
                    </article>
                  ))
                ) : (
                  <p className="world-muted">用語はまだ登録されていません。</p>
                )}
              </section>
            </div>

                                   <div className="world-detail-actions">
              <button
                type="button"
                className="world-small-button"
                onClick={() => {
                  setSelectedRelationWorld(selectedWorld);
                  setSelectedWorld(null);
                  setShowRelationshipForm(false);
                  setEditingRelationship(null);
                }}
              >
                関係図を開く
              </button>

              <button
                type="button"
                className="world-small-button"
                onClick={() => {
                  const worldToEdit = selectedWorld;
                  setSelectedWorld(null);
                  openWorldForm(worldToEdit);
                }}
              >
                編集する
              </button>

              <button
                type="button"
                className="world-small-button danger"
                onClick={() => {
                  const worldToDelete = selectedWorld;
                  setSelectedWorld(null);
                  deleteWorld(worldToDelete);
                }}
              >
                削除する
              </button>
            </div>
          </section>
        </div>
      )}

{showRelationWorldSelect && (
  <div className="world-modal-overlay">
    <section className="world-detail-modal">
      <button
        type="button"
        className="world-modal-close"
        onClick={() => setShowRelationWorldSelect(false)}
        aria-label="閉じる"
      >
        ×
      </button>

      <div className="world-detail-header">
        <span className="section-kicker">RELATIONSHIP MAP</span>
        <h2>世界観を選択</h2>
        <p>関係図を表示する世界観を選んでください。</p>
      </div>

      <div className="world-list">
        {worlds.map((world) => (
          <button
            key={world.id}
            type="button"
            className="world-small-button"
            onClick={() => {
              setSelectedRelationWorld(world);
              setShowRelationWorldSelect(false);
              setShowRelationshipForm(false);
              setEditingRelationship(null);
            }}
          >
            {world.name} の関係図を開く
          </button>
        ))}
      </div>
    </section>
  </div>
)}

      {selectedRelationWorld && (
        <div className="world-modal-overlay">
          <section className="world-detail-modal relation-modal">
            <button
              type="button"
              className="world-modal-close"
              onClick={() => setSelectedRelationWorld(null)}
              aria-label="閉じる"
            >
              ×
            </button>

            <div className="world-detail-header">
              <span className="section-kicker">RELATIONSHIP MAP</span>
              <h2>{selectedRelationWorld.name} の関係図</h2>
              <p>この世界観に所属するキャラクターの関係を管理できます。</p>
            </div>

            <div className="relation-legend">
  <span><i className="legend-dot friend"></i>友人・親友</span>
  <span><i className="legend-dot family"></i>家族</span>
  <span><i className="legend-dot lover"></i>恋人</span>
  <span><i className="legend-dot rival"></i>ライバル</span>
  <span><i className="legend-dot enemy"></i>敵対</span>
  <span><i className="legend-dot other"></i>その他</span>
</div>

<div className="relation-map-toolbar">
  <button
    type="button"
    className="world-small-button"
    onClick={() =>
      setRelationshipZoom((current) => Math.max(0.5, current - 0.1))
    }
  >
    −
  </button>

  <span>{Math.round(relationshipZoom * 100)}%</span>

  <button
    type="button"
    className="world-small-button"
    onClick={() =>
      setRelationshipZoom((current) => Math.min(2, current + 0.1))
    }
  >
    ＋
  </button>

  <button
    type="button"
    className="world-small-button"
    onClick={() => setRelationshipZoom(1)}
  >
    リセット
  </button>
</div>

                        <div className="relation-map-content">
              {relationCharacters.length === 0 ? (
                <p className="world-muted">
                  この世界観に所属するキャラクターはいません。
                </p>
              ) : (
  (() => {
    const canvasWidth = Math.max(600, relationCharacters.length * 190);
const canvasHeight = Math.max(500, relationCharacters.length * 170);

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    const radiusX = canvasWidth / 2 - 120;
const radiusY = canvasHeight / 2 - 120;

    const getPosition = (index) => {
      const angle =
        (2 * Math.PI * index) / relationCharacters.length - Math.PI / 2;

      return {
        x: centerX + radiusX * Math.cos(angle),
        y: centerY + radiusY * Math.sin(angle),
      };
    };

    return (
            <div
                  className="relation-map-canvas"
                 style={{
  width: `${canvasWidth}px`,
  height: `${canvasHeight}px`,
  transform: `scale(${relationshipZoom})`,
  transformOrigin: "center center",
}}
                >
                  <svg
                    className="relation-map-lines"
                    viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
                  >
                    <defs>
  <marker
  id="relation-arrow"
  viewBox="0 0 10 10"
  markerWidth="7"
markerHeight="7"
  refX="8"
refY="5"
  orient="auto"
  markerUnits="strokeWidth"
>
  <path
    d="M 0 0 L 10 5 L 0 10 z"
    fill="context-stroke"
  />
</marker>
</defs>
                    {relationMapRelationships.map((relation) => {
                      const sourceIndex = relationCharacters.findIndex(
                        (character) =>
                          String(character.id) ===
                          String(relation.source_character_id)
                      );

                      const targetIndex = relationCharacters.findIndex(
                        (character) =>
                          String(character.id) ===
                          String(relation.target_character_id)
                      );

                      if (sourceIndex < 0 || targetIndex < 0) return null;

                      

                      const source = getPosition(sourceIndex);
                      const target = getPosition(targetIndex);
                      const hasReverseRelation = relationMapRelationships.some(
  (item) =>
    String(item.source_character_id) ===
      String(relation.target_character_id) &&
    String(item.target_character_id) ===
      String(relation.source_character_id)
);

const pairRelations = relationMapRelationships.filter(
  (item) =>
    (
      String(item.source_character_id) ===
        String(relation.source_character_id) &&
      String(item.target_character_id) ===
        String(relation.target_character_id)
    ) ||
    (
      String(item.source_character_id) ===
        String(relation.target_character_id) &&
      String(item.target_character_id) ===
        String(relation.source_character_id)
    )
);

const relationIndex = pairRelations.findIndex(
  (item) => String(item.id) === String(relation.id)
);

const offset = pairRelations.length > 1 ? 18 : 0;

const dx = target.x - source.x;
const dy = target.y - source.y;
const distance = Math.sqrt(dx * dx + dy * dy) || 1;

const shiftX = (-dy / distance) * offset;
const shiftY = (dx / distance) * offset;

const nodeRadius = 68;

const startX =
  source.x + (dx / distance) * nodeRadius + shiftX;
const startY =
  source.y + (dy / distance) * nodeRadius + shiftY;

const endX =
  target.x - (dx / distance) * nodeRadius + shiftX;
const endY =
  target.y - (dy / distance) * nodeRadius + shiftY;

                      return (
                                                <g
                          key={relation.id}
                          onClick={() => {
  setSelectedRelationship(relation);
}}
                          style={{ cursor: "pointer" }}
                        >



                        <line
  x1={startX}
  y1={startY}
  x2={endX}
  y2={endY}
  stroke={
    relation.relation_type.includes("友人") ||
    relation.relation_type.includes("親友")
      ? "#4A90E2"
      : relation.relation_type.includes("家族")
      ? "#55B879"
      : relation.relation_type.includes("恋人")
      ? "#f1498c"
      : relation.relation_type.includes("ライバル")
      ? "#F39C45"
      : relation.relation_type.includes("敵対")
      ? "#E74C3C"
      : "#8993A4"
  }
  strokeWidth="4"
  strokeLinecap="round"
  style={{ cursor: "pointer", pointerEvents: "stroke" }}
  markerEnd="url(#relation-arrow)"
/>
                          <text
  x={(source.x + target.x) / 2 + shiftX}
y={(source.y + target.y) / 2 + shiftY - 16}
  textAnchor="middle"
  fill="#0f1c36"
  fontSize="12"
  fontWeight="600"
  paintOrder="stroke"
  stroke="white"
  strokeWidth="5"
  strokeLinejoin="round"
  style={{ cursor: "pointer" }}
>
  {relation.relation_type}
</text>
                        </g>
                      );
                    })}
                  </svg>

                  {relationCharacters.map((character, index) => {
                   const { x, y } = getPosition(index);

                    return (
  <button
    type="button"
    className="relation-character-node"
    key={character.id}
    style={{
     left: `${(x / canvasWidth) * 100}%`,
top: `${(y / canvasHeight) * 100}%`,
    }}
    onClick={() => {
      setSelectedRelationWorld(null);
      setSelectedCharacter(character);
    }}
    title={`${character.name}のプロフィールを見る`}
  >
    {character.name}
  </button>
);
                                    })}
                </div>
              );
            })()
          )}

              <button
                type="button"
                className="world-small-button"
                onClick={() => {
                  setEditingRelationship(null);
                  setRelationSourceId("");
                  setRelationTargetId("");
                  setRelationType("");
                  setRelationDescription("");
                  setRelationMemo("");
                  setShowRelationshipForm(true);
                }}
              >
                ＋ 関係を追加
              </button>

{selectedRelationship && (
  <div className="relation-detail-overlay">
    <section className="relation-detail-card">
      <button
        type="button"
        className="world-modal-close"
        onClick={() => setSelectedRelationship(null)}
        aria-label="閉じる"
      >
        ×
      </button>

      <h3>関係の詳細</h3>

      <p>
        **関係元：**
        {relationCharacters.find(
          (character) =>
            String(character.id) ===
            String(selectedRelationship.source_character_id)
        )?.name || "不明"}
      </p>

      <p>
        **関係先：**
        {relationCharacters.find(
          (character) =>
            String(character.id) ===
            String(selectedRelationship.target_character_id)
        )?.name || "不明"}
      </p>

      <p><strong>関係名：</strong>{selectedRelationship.relation_type}</p>

      <div>
        <strong>関係の説明</strong>
        <p>{selectedRelationship.description || "説明はありません。"}</p>
      </div>

      <div>
        <strong>メモ</strong>
        <p>{selectedRelationship.memo || "メモはありません。"}</p>
      </div>

      <div className="register-actions">
        <button
          type="button"
          className="register-cancel"
          onClick={() => setSelectedRelationship(null)}
        >
          閉じる
        </button>

        <button
          type="button"
          className="register-submit"
          onClick={() => {
            const relation = selectedRelationship;

            setEditingRelationship(relation);
            setRelationSourceId(String(relation.source_character_id));
            setRelationTargetId(String(relation.target_character_id));
            setRelationType(relation.relation_type || "");
            setRelationDescription(relation.description || "");
            setRelationMemo(relation.memo || "");

            setSelectedRelationship(null);
            setShowRelationshipForm(true);
          }}
        >
          編集する
        </button>
      </div>
    </section>
  </div>
)}

                            {showRelationshipForm && (
                <form
                  className="relation-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveRelationship();
                  }}
                >
                  <h3>
                    {editingRelationship ? "関係を編集" : "新しい関係を登録"}
                  </h3>

                  <label>
                    関係元のキャラクター
                    <select
                      value={relationSourceId}
                      onChange={(event) => setRelationSourceId(event.target.value)}
                      required
                    >
                      <option value="">選択してください</option>
                      {relationCharacters.map((character) => (
                        <option key={character.id} value={String(character.id)}>
                          {character.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    関係先のキャラクター
                    <select
                      value={relationTargetId}
                      onChange={(event) => setRelationTargetId(event.target.value)}
                      required
                    >
                      <option value="">選択してください</option>
                      {relationCharacters.map((character) => (
                        <option key={character.id} value={String(character.id)}>
                          {character.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    関係名
                    <input
                      list="relation-type-options"
                      value={relationType}
                      onChange={(event) => setRelationType(event.target.value)}
                      placeholder="例：親友、ライバル、師弟"
                      required
                    />
                    <datalist id="relation-type-options">
                      <option value="友人" />
                      <option value="親友" />
                      <option value="家族" />
                      <option value="恋人" />
                      <option value="ライバル" />
                      <option value="師弟" />
                      <option value="同僚" />
                      <option value="敵対" />
                    </datalist>
                  </label>

                  <label>
                    関係の説明
                    <textarea
                      value={relationDescription}
                      onChange={(event) => setRelationDescription(event.target.value)}
                      rows="3"
                      placeholder="2人の関係について説明してください"
                    />
                  </label>

                  <label>
                    メモ
                    <textarea
                      value={relationMemo}
                      onChange={(event) => setRelationMemo(event.target.value)}
                      rows="3"
                      placeholder="補足や個人的なメモ"
                    />
                  </label>

                    {editingRelationship && (
                      <button
                        type="button"
                        className="world-small-button danger"
                        onClick={async () => {
                          const confirmed = window.confirm(
                            "この関係を削除しますか？"
                          );

                          if (!confirmed) return;

                          const relationId = String(editingRelationship.id);

                          const { error } = await supabase
                            .from("relationships")
                            .delete()
                            .eq("id", relationId);

                          if (error) {
                            console.error("関係の削除に失敗しました:", error);
                            alert("関係を削除できませんでした。");
                            return;
                          }

                          setRelationships((current) =>
                            current.filter(
                              (relation) =>
                                String(relation.id) !== relationId
                            )
                          );

                          setShowRelationshipForm(false);
                          setEditingRelationship(null);
                          setRelationSourceId("");
                          setRelationTargetId("");
                          setRelationType("");
                          setRelationDescription("");
                          setRelationMemo("");

                          alert("関係を削除しました！");
                        }}
                      >
                        この関係を削除
                      </button>
                    )}

                  <div className="register-actions">
                    <button
                      type="button"
                      className="register-cancel"
                      onClick={() => setShowRelationshipForm(false)}
                    >
                      キャンセル
                    </button>
                    <button type="submit" className="register-submit">
                      保存する
                    </button>
                  </div>
                </form>
              )}
            </div>

          </section>
        </div>
      )}

      <footer className="footer">
        <span>✦ CHARA LIBRARY</span>
        <span>大切な物語を、大切な仲間と。</span>
      </footer>
    </div>
  );
}
