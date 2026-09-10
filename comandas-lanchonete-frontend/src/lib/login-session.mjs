export async function autenticarRenovandoSocket({ autenticar, descartarSocket, atualizarSessao }) {
    const usuario = await autenticar();
    descartarSocket();
    await atualizarSessao();
    return usuario;
}
