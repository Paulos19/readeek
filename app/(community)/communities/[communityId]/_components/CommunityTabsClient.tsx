"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Settings } from "lucide-react";
import dynamic from "next/dynamic";
import type { Prisma } from "@prisma/client";

// Importa os componentes filhos que são seguros para o cliente
import CreatePostForm from "./CreatePostForm";
import CommunityPostCard from "./CommunityPostCard";
import MembersManagementTab from "./MembersManagementTab";

// Carrega dinamicamente o componente de upload AQUI DENTRO, no Componente Cliente
const FileUploadClient = dynamic(() => import("./FileUploadClient"), {
    ssr: false,
    loading: () => <div className="w-full h-36 animate-pulse bg-card border rounded-lg"></div>
});

// Define um tipo para os dados complexos da comunidade que serão recebidos como props
type CommunityWithDetails = Prisma.CommunityGetPayload<{
    include: {
        files: { include: { uploader: { select: { name: true } } } };
        posts: {
            include: {
                author: {
                    select: {
                        id: true; name: true; image: true;
                        communityMemberships: true;
                    }
                };
                _count: { select: { reactions: true; comments: true } };
                reactions: true;
                comments: { include: { author: { select: { id: true; name: true; image: true } } } };
            }
        };
        members: { include: { user: { select: { id: true; name: true; image: true } } } };
    }
}>;

interface CommunityTabsClientProps {
    community: CommunityWithDetails;
    userId: string | undefined;
    canManage: boolean;
    isOwner: boolean;
}

export default function CommunityTabsClient({ community, userId, canManage, isOwner }: CommunityTabsClientProps) {
    return (
        <Tabs defaultValue="forum" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-flex">
                <TabsTrigger value="forum">Fórum</TabsTrigger>
                <TabsTrigger value="study">Material de Estudo</TabsTrigger>
                {canManage && <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" />Configurações</TabsTrigger>}
            </TabsList>

            <TabsContent value="forum" className="mt-4">
                <CreatePostForm communityId={community.id} />
                <div className="space-y-4">
                    {community.posts.map(post => {
                        const authorRole = post.author.communityMemberships[0]?.role;
                        return <CommunityPostCard key={post.id} post={post as any} currentUserId={userId} isOwner={isOwner} authorRole={authorRole} />
                    })}
                </div>
            </TabsContent>

            <TabsContent value="study" className="mt-4">
                <div className="space-y-3">
                    {community.files.length === 0 ? (
                        <p className="text-center text-muted-foreground py-10">Nenhum material de estudo foi adicionado ainda.</p>
                    ) : (
                        community.files.map(file => (
                            <Card key={file.id}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold">{file.title}</h4>
                                        <p className="text-sm text-muted-foreground">Autor: {file.uploader?.name || 'Desconhecido'}</p>
                                    </div>
                                    <Button asChild variant="outline" size="sm"><a href={file.fileUrl} download><Download className="w-4 h-4 mr-2" />Baixar</a></Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </TabsContent>

            {canManage && (
                <TabsContent value="settings" className="mt-4 space-y-8">
                    <FileUploadClient communityId={community.id} />
                    {isOwner && <MembersManagementTab community={community} />}
                </TabsContent>
            )}
        </Tabs>
    );
}