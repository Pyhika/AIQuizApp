"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

// 3D キャラクターは CSR のみで読み込み
const ChatBotCharacter = dynamic(() => import("@/components/ChatBotCharacter"), {
  ssr: false,
  loading: () => (
    <div className="w-64 h-64 flex items-center justify-center bg-gray-200 rounded-lg">
      Loading...
    </div>
  ),
});

export default function Menu() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 bg-gradient-to-b from-white to-gray-100 p-4">
      <ChatBotCharacter />
      <div className="flex flex-col sm:flex-row gap-6">
        <Link
          href="/new"
          className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-lg font-semibold shadow-md transition-colors"
        >
          新規開発をしますか？
        </Link>
        <Link
          href="/edit"
          className="px-6 py-3 rounded-lg bg-gray-300 hover:bg-gray-400 text-lg font-semibold shadow-md transition-colors"
        >
          既存アプリの編集をしますか？
        </Link>
      </div>
    </div>
  );
}
