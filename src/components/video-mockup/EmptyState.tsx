
import { Monitor } from "lucide-react";

const EmptyState = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
      <Monitor size={48} className="text-muted-foreground/50 mb-3" />
      <h3 className="text-lg font-medium text-muted-foreground">Upload an image to preview</h3>
      <p className="text-sm text-muted-foreground/70 mt-2">
        Your image will appear here in the mockup
      </p>
    </div>
  );
};

export default EmptyState;
