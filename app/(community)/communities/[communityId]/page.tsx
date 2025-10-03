import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp, Download, Settings } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { uploadCommunityFile } from "@/app/actions/communityUploadActions";

// Importa os componentes filhos necessários
import CreatePostForm from "./_components/CreatePostForm";
import CommunityPostCard from "./_components/CommunityPostCard";
import MembersManagementTab from "./_components/MembersManagementTab";

// Componente para o formulário de upload de ficheiros
async function FileUploadForm({ communityId }: { communityId: string }) {
    return (
        <form 
            action={async (formData) => {
                "use server";
                await uploadCommunityFile(communityId, formData);
            }}
            className="mb-6"
        >
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

export default async function CommunityPage({ params }: { params: { communityId: string } }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const community = await prisma.community.findUnique({
    where: { id: params.communityId },
    include: {
      files: {
        orderBy: { createdAt: "desc" },
        include: { uploader: { select: { name: true } } },
      },
      posts: {
        orderBy: { createdAt: 'desc' },
        include: {
            author: { 
                select: { 
                    id: true, name: true, image: true,
                    communityMemberships: { where: { communityId: params.communityId } }
                } 
            },
            _count: { select: { reactions: true, comments: true } },
            reactions: { where: { userId: userId ?? undefined } },
            // QUERY ATUALIZADA: Busca todos os comentários de cada post
            comments: {
              orderBy: { createdAt: 'asc' },
              include: {
                author: { select: { id: true, name: true, image: true } }
              }
            }
        }
      },
      members: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: 'asc' }
      }
    },
  });

  if (!community) {
    notFound();
  }

  // Lógica de permissões
  const currentUserMembership = community.members.find(m => m.userId === userId);
  const isOwner = currentUserMembership?.role === "OWNER";
  const isHonorary = currentUserMembership?.role === "HONORARY_MEMBER";
  const canManage = isOwner || isHonorary;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl font-bold">{community.name}</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">{community.description}</p>
      </div>

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
                        <p className="text-sm text-muted-foreground">Autor: {file.author}</p>
                    </div>
                    <Button asChild variant="outline" size="sm"><a href={file.fileUrl} download><Download className="w-4 h-4 mr-2"/>Baixar</a></Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {canManage && (
            <TabsContent value="settings" className="mt-4 space-y-8">
                <FileUploadForm communityId={community.id} />
                {isOwner && <MembersManagementTab community={community} />}
            </TabsContent>
        )}
      </Tabs>
    </div>
  );
}