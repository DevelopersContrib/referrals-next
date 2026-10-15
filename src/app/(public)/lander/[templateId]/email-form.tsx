"use client";

export function EmailForm({ buttonText = "Join Now" }: { buttonText?: string }) {
  return (
    <form
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        type="email"
        placeholder="Enter your email"
        required
        className="flex-1 rounded-lg border border-white/10 bg-[#212529] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-[#FF5C62]/50 focus:ring-1 focus:ring-[#FF5C62]/50"
      />
      <button
        type="submit"
        className="rounded-lg bg-[#FF5C62] px-6 py-3 text-sm font-medium text-white transition-all hover:bg-[#ff4f58] hover:shadow-lg hover:shadow-[#FF5C62]/25"
      >
        {buttonText}
      </button>
    </form>
  );
}
