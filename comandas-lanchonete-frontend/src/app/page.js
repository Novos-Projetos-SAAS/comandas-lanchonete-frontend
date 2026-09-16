import HomeClient from "./HomeClient";

export const metadata = {
    title: "Atendimento na mesa",
    description: "Leia o QR Code da sua mesa para acessar o atendimento digital."
};

export default function Home() {
    return <HomeClient />;
}
