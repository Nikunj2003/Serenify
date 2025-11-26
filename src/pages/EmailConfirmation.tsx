import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Mail, CheckCircle2 } from "lucide-react";

const EmailConfirmation = () => {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900 -z-20" />
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 blur-3xl animate-float" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="glass-card border-white/40 shadow-xl text-center">
                    <CardHeader className="space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                            <Mail className="w-8 h-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Check your inbox</CardTitle>
                        <CardDescription className="text-base">
                            We've sent a confirmation link to your email address. Please click the link to verify your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 bg-muted/30 rounded-lg border border-primary/10 flex items-start gap-3 text-left">
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <div className="text-sm text-muted-foreground">
                                <p className="font-medium text-foreground mb-1">Next steps:</p>
                                <ol className="list-decimal list-inside space-y-1">
                                    <li>Open the email from MindCompanion</li>
                                    <li>Click the "Confirm your mail" link</li>
                                    <li>You will be redirected to the login page</li>
                                </ol>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Link to="/login" className="w-full">
                            <Button variant="outline" className="w-full">
                                Back to Login
                            </Button>
                        </Link>
                        <p className="text-xs text-muted-foreground">
                            Didn't receive the email? Check your spam folder or{" "}
                            <button className="text-primary hover:underline">resend email</button>
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
};

export default EmailConfirmation;
