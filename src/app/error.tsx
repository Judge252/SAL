"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="container empty-state">
      <h1>حدث خطأ · Something went wrong</h1>
      <button className="button" onClick={reset}>
        حاول مجددًا · Try again
      </button>
    </div>
  );
}
