import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container empty-state">
      <span className="eyebrow">404</span>
      <h1>هذه الصفحة غير موجودة</h1>
      <p>Page not found · הדף לא נמצא</p>
      <Link className="button" href="/">
        الرئيسية · Home · ראשי
      </Link>
    </div>
  );
}
