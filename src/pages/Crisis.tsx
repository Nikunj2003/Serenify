import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Phone, Mail, Globe, ArrowLeft } from "lucide-react";
import { crisisHelplines, stateHelplines } from "@/lib/mockData";

const Crisis = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-destructive/5 to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/dashboard" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </Button>

        {/* Emergency Banner */}
        <Card className="mb-8 border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-destructive">Need Help Now?</h2>
                <p className="text-sm leading-relaxed">
                  If you're in crisis, you're not alone. Help is available 24/7. 
                  Please reach out to one of these helplines immediately.
                </p>
                <div className="bg-card rounded-lg p-4 border border-destructive/20">
                  <p className="text-sm font-semibold mb-2">
                    🚨 If you are in immediate danger:
                  </p>
                  <p className="text-sm">
                    Call <strong>112</strong> (India Emergency Services) or go to your nearest hospital emergency room.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* National Helplines */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">National Mental Health Helplines</h2>
          <div className="grid gap-4">
            {crisisHelplines.map((helpline, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <div>
                      <div className="text-xl">{helpline.name}</div>
                      <div className="text-sm font-normal text-muted-foreground mt-1">
                        {helpline.subtitle}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{helpline.description}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button variant="destructive" className="gap-2" asChild>
                      <a href={`tel:${helpline.phone}`}>
                        <Phone className="w-4 h-4" />
                        Call {helpline.phone}
                      </a>
                    </Button>
                    {helpline.hasText && (
                      <Button variant="outline" className="gap-2" asChild>
                        <a href={`sms:${helpline.phone}`}>
                          <Mail className="w-4 h-4" />
                          Text
                        </a>
                      </Button>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>📞 {helpline.availability}</p>
                    <p>🌍 {helpline.languages}</p>
                    {helpline.email && <p>✉️ {helpline.email}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* State-Specific Helplines */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">State-Specific Helplines</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {stateHelplines.map((helpline, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <h3 className="font-semibold">{helpline.state} - {helpline.name}</h3>
                      <p className="text-sm text-muted-foreground">{helpline.availability}</p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <a href={`tel:${helpline.phone}`} className="gap-2">
                        <Phone className="w-4 h-4" />
                        Call
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* International Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              International Helplines
            </CardTitle>
            <CardDescription>
              Find helplines in other countries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <a
                href="https://findahelpline.com"
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                Visit findahelpline.com
                <Globe className="w-4 h-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Immediate Coping Tools */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Immediate Coping Tools</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">5-4-3-2-1 Grounding</CardTitle>
                <CardDescription>Use your senses to stay present</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-sm">
                  <li>👀 Name <strong>5 things</strong> you can see</li>
                  <li>🤚 Name <strong>4 things</strong> you can touch</li>
                  <li>👂 Name <strong>3 things</strong> you can hear</li>
                  <li>👃 Name <strong>2 things</strong> you can smell</li>
                  <li>👅 Name <strong>1 thing</strong> you can taste</li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Box Breathing</CardTitle>
                <CardDescription>Calm your nervous system quickly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <div className="text-5xl mb-2">🫁</div>
                  <p className="text-sm font-medium">Breathe in rhythm</p>
                </div>
                <ol className="space-y-2 text-sm">
                  <li>Breathe <strong>in</strong> for 4 counts</li>
                  <li><strong>Hold</strong> for 4 counts</li>
                  <li>Breathe <strong>out</strong> for 4 counts</li>
                  <li><strong>Hold</strong> for 4 counts</li>
                  <li>Repeat 5 times</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Crisis;
