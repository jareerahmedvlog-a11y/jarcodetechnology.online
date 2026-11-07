import Link from "next/link";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <div className="section-pad">
      <Container className="max-w-xl text-center">
        <p className="text-sm font-semibold tracking-[0.2em] text-indigo-300 uppercase">
          404
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold text-text sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-4 text-text-muted">
          The page you are looking for does not exist or may have moved.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/" className="btn-primary">
            Go to Homepage
          </Link>
          <Link href="/#contact" className="btn-secondary">
            Contact Us
          </Link>
        </div>
      </Container>
    </div>
  );
}
