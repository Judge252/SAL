import Image from "next/image";
export default function Loading() {
  return (
    <div className="loading-state" role="status">
      <Image src="/brand/sal.png" width={90} height={90} alt="SAL" />
      <p>لحظة من فضلك · Loading · טוען</p>
      <div className="typing">
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}
