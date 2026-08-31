"use client";

import Link from "next/link";
import { useEffect,useMemo,useState } from "react";
import { ArrowDownCircle,ArrowUpCircle,History,Loader2,Lock,ShoppingCart } from "lucide-react";
import Can from "@/components/ui/can/Can";
import Table from "@/components/ui/table";
import Pagination from "@/components/ui/pagination";
import ModalVendaRapida from "@/components/modals/vendaRapida";
import styles from "./index.module.css";

const LIMITE_POR_PAGINA=10;

export default function PainelCaixaAberto({caixa,movimentacoes,onFechar,onRegistrarMovimento,onVendaRapida,isLoading,isVendaLoading}){
    const [modalOpen,setModalOpen]=useState(false);
    const [modalTipo,setModalTipo]=useState("SANGRIA");
    const [valor,setValor]=useState("");
    const [observacao,setObservacao]=useState("");
    const [vendaRapidaOpen,setVendaRapidaOpen]=useState(false);
    const [pagina,setPagina]=useState(1);

    const vendas=movimentacoes.filter(m=>m.categoria==="VENDA");
    const estornos=movimentacoes.filter(m=>m.categoria==="ESTORNO");
    const vendasBrutas=vendas.reduce((acc,m)=>acc+Number(m.valor),0);
    const totalEstornos=estornos.reduce((acc,m)=>acc+Number(m.valor),0);
    const totalFaturado=vendasBrutas-totalEstornos;
    const vendasDinheiroBrutas=vendas.filter(m=>String(m.forma_pagamento||"").trim().toLowerCase()==="dinheiro").reduce((acc,m)=>acc+Number(m.valor),0);
    const estornosDinheiro=estornos.filter(m=>String(m.forma_pagamento||"").trim().toLowerCase()==="dinheiro").reduce((acc,m)=>acc+Number(m.valor),0);
    const vendasDinheiro=vendasDinheiroBrutas-estornosDinheiro;
    const totalSuprimentos=movimentacoes.filter(m=>m.categoria==="SUPRIMENTO"&&m.tipo==="ENTRADA").reduce((acc,m)=>acc+Number(m.valor),0);
    const totalSangrias=movimentacoes.filter(m=>m.categoria==="SANGRIA"&&m.tipo==="SAIDA").reduce((acc,m)=>acc+Number(m.valor),0);
    const saldoGaveta=Number(caixa.saldo_inicial)+vendasDinheiro+totalSuprimentos-totalSangrias;

    const totalPaginas=Math.max(Math.ceil(movimentacoes.length/LIMITE_POR_PAGINA),1);

    const movimentacoesPaginadas=useMemo(()=>{
        const inicio=(pagina-1)*LIMITE_POR_PAGINA;
        return movimentacoes.slice(inicio,inicio+LIMITE_POR_PAGINA);
    },[movimentacoes,pagina]);

    useEffect(()=>{
        setPagina(1);
    },[movimentacoes.length]);

    useEffect(()=>{
        if(pagina>totalPaginas)setPagina(totalPaginas);
    },[pagina,totalPaginas]);

    const openModal=tipo=>{
        setModalTipo(tipo);
        setValor("");
        setObservacao("");
        setModalOpen(true);
    };

    const handleSubmeterMovimento=async event=>{
        event.preventDefault();

        const success=await onRegistrarMovimento({
            tipo:modalTipo==="SANGRIA"?"SAIDA":"ENTRADA",
            categoria:modalTipo,
            valor:parseFloat(valor.replace(",",".")),
            observacao
        });

        if(success)setModalOpen(false);
    };

    const formatCurrency=val=>new Intl.NumberFormat("pt-BR",{
        style:"currency",
        currency:"BRL"
    }).format(Number(val||0));

    const formatDate=dateStr=>new Intl.DateTimeFormat("pt-BR",{
        dateStyle:"short",
        timeStyle:"short"
    }).format(new Date(dateStr));

    const columns=[
        {
            header:"Data / Hora",
            accessor:"id",
            render:(_,mov)=>formatDate(mov.criado_em)
        },
        {
            header:"Origem",
            accessor:"id",
            render:(_,mov)=>(
                <span className={styles.origin}>
                    {mov.referencia||mov.origem||"-"}
                </span>
            )
        },
        {
            header:"Categoria",
            accessor:"id",
            render:(_,mov)=>(
                <span className={`${styles.badge} ${mov.tipo==="ENTRADA"?styles.badgeIn:styles.badgeOut}`}>
                    {mov.categoria}
                </span>
            )
        },
        {
            header:"Observação",
            accessor:"id",
            render:(_,mov)=>(
                <span className={styles.obsCell}>
                    {mov.observacao||"-"}
                </span>
            )
        },
        {
            header:"Pagamento",
            accessor:"id",
            render:(_,mov)=>mov.forma_pagamento||"-"
        },
        {
            header:"Valor",
            accessor:"id",
            className:styles.textRight,
            render:(_,mov)=>(
                <span className={mov.tipo==="ENTRADA"?styles.textSuccess:styles.textDanger}>
                    {mov.tipo==="ENTRADA"?"+ ":"- "}
                    {formatCurrency(mov.valor)}
                </span>
            )
        }
    ];

    return (
        <div className={styles.wrapper}>
            <div className={styles.summaryGrid}>
                <div className={styles.summaryCard} style={{color:"var(--text-secondary)"}}>
                    <div>
                        <span className={styles.summaryLabel}>Fundo de Troco</span>
                        <div className={styles.summaryValue}>{formatCurrency(caixa.saldo_inicial)}</div>
                    </div>
                </div>

                <div className={styles.summaryCard} style={{color:"#10b981"}}>
                    <div>
                        <span className={styles.summaryLabel}>Faturamento Líquido</span>
                        <div className={styles.summaryValue}>{formatCurrency(totalFaturado)}</div>
                    </div>
                </div>

                <div className={styles.summaryCard} style={{color:"var(--text-secondary)"}}>
                    <div>
                        <span className={styles.summaryLabel}>Vendas em Dinheiro</span>
                        <div className={styles.summaryValue}>{formatCurrency(vendasDinheiro)}</div>
                    </div>
                </div>

                <div className={styles.summaryCard} style={{color:"var(--brand-orange)"}}>
                    <div>
                        <span className={styles.summaryLabel}>Dinheiro na Gaveta</span>
                        <div className={styles.summaryValue}>{formatCurrency(saldoGaveta)}</div>
                    </div>
                </div>
            </div>

            <div className={styles.actionsBar}>
                <div className={styles.actionsGroup}>
                    <Can perform="vendas.criar">
                        <button type="button" onClick={()=>setVendaRapidaOpen(true)} className={styles.btnSale}>
                            <ShoppingCart size={18}/>
                            Venda Rápida
                        </button>
                    </Can>

                    <button type="button" onClick={()=>openModal("SUPRIMENTO")} className={styles.btnSuccess}>
                        <ArrowUpCircle size={18}/>
                        Suprimento
                    </button>

                    <button type="button" onClick={()=>openModal("SANGRIA")} className={styles.btnDanger}>
                        <ArrowDownCircle size={18}/>
                        Sangria
                    </button>
                </div>

                <div className={styles.actionsGroup}>
                    <Can perform="vendas.listar">
                        <Link href="/admin/vendas" className={styles.btnHistory}>
                            <History size={18}/>
                            Histórico
                        </Link>
                    </Can>

                    <button type="button" onClick={onFechar} disabled={isLoading} className={styles.btnFinish}>
                        {isLoading?<Loader2 size={18} className={styles.spinnerIcon}/>:<Lock size={18}/>}
                        Encerrar Caixa
                    </button>
                </div>
            </div>

            <div className={styles.movements}>
                <Table
                    columns={columns}
                    data={movimentacoesPaginadas}
                    isLoading={false}
                />

                <Pagination
                    currentPage={pagina}
                    totalPages={totalPaginas}
                    onPageChange={setPagina}
                />
            </div>

            {modalOpen&&(
                <div className={styles.modalOverlay}>
                    <div className={styles.modalBox}>
                        <h3 className={styles.modalTitle}>
                            Registrar {modalTipo==="SANGRIA"?"Sangria":"Suprimento"}
                        </h3>

                        <form onSubmit={handleSubmeterMovimento} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Valor (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    value={valor}
                                    onChange={event=>setValor(event.target.value)}
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Motivo / Observação</label>
                                <input
                                    type="text"
                                    required
                                    value={observacao}
                                    onChange={event=>setObservacao(event.target.value)}
                                    className={styles.input}
                                    placeholder="Ex: Troco, pagamento de fornecedor..."
                                />
                            </div>

                            <div className={styles.actions}>
                                <button type="button" onClick={()=>setModalOpen(false)} className={styles.btnCancel}>
                                    Cancelar
                                </button>

                                <button type="submit" disabled={isLoading} className={styles.btnSave}>
                                    {isLoading?"Salvando...":"Confirmar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ModalVendaRapida
                open={vendaRapidaOpen}
                onClose={()=>setVendaRapidaOpen(false)}
                onFinalizar={onVendaRapida}
                isLoading={isVendaLoading}
            />
        </div>
    );
}