
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface VideoOverlaysProps {
  selectedOverlay: number | null;
  onSelectOverlay: (index: number) => void;
}

const overlays = [
  {
    name: "Elegant Frame",
    description: "Classic bordered frame with subtle blur effect",
    preview: "linear-gradient(to right, #e6e9f0 0%, #eef1f5 100%)"
  },
  {
    name: "Modern Split",
    description: "Contemporary split-screen design with light accent",
    preview: "linear-gradient(to right, #accbee 0%, #e7f0fd 100%)"
  },
  {
    name: "Dynamic Motion",
    description: "Gradient motion effect with dramatic shadows",
    preview: "linear-gradient(to top, #e6b980 0%, #eacda3 100%)"
  }
];

const VideoOverlays = ({ selectedOverlay, onSelectOverlay }: VideoOverlaysProps) => {
  return (
    <div className="space-y-3">
      {overlays.map((overlay, index) => (
        <Card 
          key={index}
          className={cn(
            "cursor-pointer overflow-hidden overlay-card",
            selectedOverlay === index && "selected-overlay"
          )}
          onClick={() => onSelectOverlay(index)}
        >
          <CardContent className="p-3 flex items-center gap-3">
            <div 
              className="w-14 h-14 rounded flex-shrink-0"
              style={{ background: overlay.preview }}
            />
            <div>
              <h3 className="font-medium text-sm">{overlay.name}</h3>
              <p className="text-xs text-muted-foreground">{overlay.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default VideoOverlays;
