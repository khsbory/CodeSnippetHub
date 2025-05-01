import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Separator className="mb-6" />
        <div className="text-sm text-muted-foreground text-center">
          <p>Access bridge all rights reserved</p>
        </div>
      </div>
    </footer>
  );
}
