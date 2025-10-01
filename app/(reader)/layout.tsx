export default function ReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Este layout não tem nenhum estilo ou componente extra.
  // Ele simplesmente renderiza a página, dando-lhe controle total sobre a tela.
  return <>{children}</>;
}