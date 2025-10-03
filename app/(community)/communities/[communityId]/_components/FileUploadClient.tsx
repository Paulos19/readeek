"use client";

import { useRef } from "react";
import { uploadCommunityFile } from "@/app/actions/communityUploadActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp } from "lucide-react";
import { toast } from "sonner"; // Usando o sonner para feedback

export default function FileUploadClient({ communityId }: { communityId: string }) {
    const formRef = useRef<HTMLFormElement>(null);

    const handleAction = async (formData: FormData) => {
        const result = await uploadCommunityFile(communityId, formData);

        if (result?.error) {
            toast.error("Erro no upload", { description: result.error });
        } else {
            toast.success("Sucesso!", { description: "Ficheiro enviado para a comunidade." });
            formRef.current?.reset();
        }
    };

    return (
        <form ref={formRef} action={handleAction} className="mb-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Adicionar Novo Material</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
                    <input 
                        type="file" 
                        name="file" 
                        required 
                        className="flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" 
                        accept=".epub,.pdf,.txt"
                    />
                    <Button type="submit" size="sm" className="w-full sm:w-auto">
                        <FileUp className="w-4 h-4 mr-2" />
                        Enviar
                    </Button>
                </CardContent>
            </Card>
        </form>
    );
}