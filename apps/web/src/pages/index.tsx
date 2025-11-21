// import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom"; // Next.jsのLinkとは違うので注意

export default function HomePage() {
  return (
    <div className="p-10 flex flex-col items-center gap-6">
      <h1 className="text-4xl font-bold">VRClo Top</h1>
      <Link to="/avatars">
        {/* <Button>アバター一覧を見る</Button> */}
      </Link>
    </div>
  );
}