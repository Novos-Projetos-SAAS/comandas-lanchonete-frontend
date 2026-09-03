const objetosRasosIguais=(a,b)=>{
    if(a===b)return true;
    if(!a||!b||typeof a!=="object"||typeof b!=="object")return false;
    const chavesA=Object.keys(a),chavesB=Object.keys(b);
    if(chavesA.length!==chavesB.length)return false;
    return chavesA.every(chave=>Object.prototype.hasOwnProperty.call(b,chave)&&Object.is(a[chave],b[chave]));
};

export const reconciliarComandas=(atuais,recebidas)=>{
    const mapaAtual=new Map(atuais.map(comanda=>[String(comanda.id),comanda]));

    return recebidas.map(comanda=>{
        const anterior=mapaAtual.get(String(comanda.id));
        return anterior&&objetosRasosIguais(anterior,comanda)?anterior:comanda;
    });
};

export const atualizarComandaNaLista=(atuais,atualizada,statusFilter="")=>{
    const id=String(atualizada.id);

    if(statusFilter&&atualizada.status!==statusFilter){
        return atuais.filter(comanda=>String(comanda.id)!==id);
    }

    return atuais.map(comanda=>
        String(comanda.id)===id
            ?objetosRasosIguais(comanda,atualizada)?comanda:atualizada
            :comanda
    );
};