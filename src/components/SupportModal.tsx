import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, Heart, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SupportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SupportModal = ({ isOpen, onClose }: SupportModalProps) => {
    const navigate = useNavigate();

    const handleAction = (path: string) => {
        onClose();
        navigate(path);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>We noticed you're feeling down</DialogTitle>
                    <DialogDescription>
                        It's okay to have tough days. We're here to support you. Would you like to try one of these?
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Button
                        variant="outline"
                        className="h-auto py-4 justify-start gap-4 hover:bg-primary/5 hover:border-primary/30"
                        onClick={() => handleAction("/chat")}
                    >
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <MessageSquare className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                            <div className="font-semibold">Chat with Companion</div>
                            <div className="text-sm text-muted-foreground">Talk through your feelings</div>
                        </div>
                    </Button>

                    <Button
                        variant="outline"
                        className="h-auto py-4 justify-start gap-4 hover:bg-primary/5 hover:border-primary/30"
                        onClick={() => handleAction("/wellness")}
                    >
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                            <Heart className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="text-left">
                            <div className="font-semibold">Wellness Activities</div>
                            <div className="text-sm text-muted-foreground">Try a breathing exercise</div>
                        </div>
                    </Button>

                    <Button
                        variant="outline"
                        className="h-auto py-4 justify-start gap-4 hover:bg-destructive/5 hover:border-destructive/30"
                        onClick={() => window.open("https://988lifeline.org/", "_blank")}
                    >
                        <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                            <Phone className="h-5 w-5 text-destructive" />
                        </div>
                        <div className="text-left">
                            <div className="font-semibold">Crisis Support</div>
                            <div className="text-sm text-muted-foreground">Get immediate help (988)</div>
                        </div>
                    </Button>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Maybe later</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SupportModal;
