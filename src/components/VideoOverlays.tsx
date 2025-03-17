
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  },
  {
    name: "Warm Glow",
    description: "Soft warm overlay with gentle light effects",
    preview: "linear-gradient(to right, #ee9ca7, #ffdde1)"
  },
  {
    name: "Cool Tone",
    description: "Muted cool-toned filter with professional finish",
    preview: "linear-gradient(to right, #243949 0%, #517fa4 100%)"
  },
  {
    name: "Vibrant Pop",
    description: "Bold colorful accent with artistic flair",
    preview: "linear-gradient(90deg, hsla(24, 100%, 83%, 1) 0%, hsla(341, 91%, 68%, 1) 100%)"
  }
];

const VideoOverlays = ({ selectedOverlay, onSelectOverlay }: VideoOverlaysProps) => {
  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="all">All Overlays</TabsTrigger>
        <TabsTrigger value="popular">Popular</TabsTrigger>
      </TabsList>
      
      <TabsContent value="all" className="space-y-3">
        {overlays.map((overlay, index) => (
          <Card 
            key={index}
            className={cn(
              "cursor-pointer overflow-hidden transition-all hover:shadow-md",
              selectedOverlay === index && "ring-2 ring-primary shadow-md"
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
      </TabsContent>
      
      <TabsContent value="popular" className="space-y-3">
        {overlays.slice(0, 3).map((overlay, index) => (
          <Card 
            key={index}
            className={cn(
              "cursor-pointer overflow-hidden transition-all hover:shadow-md",
              selectedOverlay === index && "ring-2 ring-primary shadow-md"
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
      </TabsContent>
    </Tabs>
  );
};

export default VideoOverlays;
