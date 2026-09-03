import Can from "@/components/ui/can/Can";
import AccessDenied from "@/components/ui/accessDenied";
import VendaDetalhesClient from "./VendaDetalhesClient";

export const metadata = { title: "Detalhes da Venda | Admin" };

export default function VendaDetalhesPage() {
    return <Can perform="vendas.visualizar" fallback={<AccessDenied />}><VendaDetalhesClient /></Can>;
}
