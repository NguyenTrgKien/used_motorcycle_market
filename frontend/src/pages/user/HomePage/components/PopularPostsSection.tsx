import type { ListingPost } from "../../Post/post.types";
import PostCard from "./PostCard";
import SectionHeading from "./SectionHeading";

function PopularPostsSection({ posts }: { posts: ListingPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-8 rounded-2xl bg-white">
      <SectionHeading
        title="Xe được xem nhiều"
        description="Những tin đăng đang nhận được nhiều sự quan tâm"
      />
      <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-4 lg:p-8">
        {posts.slice(0, 4).map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}

export default PopularPostsSection;
