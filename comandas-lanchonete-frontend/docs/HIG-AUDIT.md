# Auditoria HIG — Lanchonete

Data: 02/10/2026. Repositório: Novos-Projetos-SAAS/comandas-lanchonete-frontend.
Base auditada: 5642e07b2f8ed5db723af4e119b0fd894b33931c. Branch de correção: comandas-lanchonete.

A aplicação é web (Next.js/React). Esta auditoria usa os princípios de acessibilidade, legibilidade e consistência da Apple, adaptados ao navegador. Não exige SwiftUI, SF Symbols ou aparência de app nativo. As skills utilizadas foram HIG Foundations, Selection and Input Controls, Presentation Components e Project Context.

Os problemas GRAVES abaixo foram corrigidos. MÉDIO e FINO permanecem como recomendações. A HIG não determina uma grade universal de 8 px nem um único raio de borda; os valores propostos nesses níveis são decisões de design fundamentadas em suas recomendações de consistência.

## 1. GRAVE — corrigido

| Item e evidência anterior | Arquivos | Regra HIG | Fix aplicado |
|---|---|---|---|
| G1. Contraste insuficiente: branco sobre #f26a1b = **3,06:1**; sobre #f5742b = **2,83:1**. Erro #ef4444 sobre branco = **3,76:1**. | [globals.css](../src/app/globals.css), [login CSS](../src/app/(auth)/login/page.module.css), [home CSS](../src/app/page.module.css), [cardápio da mesa CSS](../src/app/m/[token]/cardapio/cardapio.module.css), [InputForm CSS](../src/components/ui/inputForm/index.module.css), [SelectForm CSS](../src/components/ui/selectForm/index.module.css), [venda rápida](../src/components/modals/vendaRapida/index.jsx). Propagado aos outros consumidores de cores compartilhadas. | [Accessibility — Vision](https://developer.apple.com/design/human-interface-guidelines/accessibility): contraste mínimo e cores adaptadas. | Separar cor de texto e fundo de ação. Fundo #ad430c com branco = **5,86:1**; texto de destaque escuro #ff9b62 sobre #1e1e1e = **8,03:1**. Erro claro #b91c1c = **6,47:1**. SweetAlert usa os tokens de fundo, inclusive no tema escuro. |
| G2. Status de comandas e mesas pouco legíveis. “Aberta” usava #f97316 com branco; “Paga” usava #21d463. | [ComandaCard CSS](../src/components/comandas/ComandaCard/index.module.css), [ComandasClient CSS](../src/app/admin/comandas/ComandasClient.module.css), [MesasClient CSS](../src/app/admin/mesas/MesasClient.module.css). | [Accessibility — Vision](https://developer.apple.com/design/human-interface-guidelines/accessibility): contraste e informação compreensível sem depender apenas da cor. | Escurecer fundos de status, preservar os rótulos escritos e usar branco opaco no identificador da comanda. Teste de regressão verifica **≥4,5:1** em todas as faixas de status dos dois componentes. |
| G3. Teclado: select eliminava outline; mostrar senha tinha tabIndex=-1; ordenação dependia de clicar no th. | [globals.css](../src/app/globals.css), [login](../src/app/(auth)/login/page.jsx), [reset](../src/app/(auth)/reset/[token]/page.jsx), [Table](../src/components/ui/table/index.jsx), [ActionMenu](../src/components/ui/actionMenu/index.jsx). | [Accessibility — Speech/Mobility](https://developer.apple.com/design/human-interface-guidelines/accessibility): permitir navegação e interação por teclado. | Foco visível de 3 px; controles de senha entram na ordem de Tab; ordenação usa botão nativo com Enter/Space e aria-sort; Escape fecha o menu de ações e restaura seu foco. |
| G4. Controles sem nome explícito ou contexto: abrir navegação, paginação da venda e ajustar quantidade no carrinho. | [Header](../src/components/header/Header.jsx), [Pagination](../src/components/ui/pagination/index.jsx), [venda rápida](../src/components/modals/vendaRapida/index.jsx), [produtos da comanda](../src/components/modals/produtosComanda/index.jsx), [carrinho público](../src/app/m/[token]/cardapio/CardapioMesaClient.jsx). | [Accessibility — Vision](https://developer.apple.com/design/human-interface-guidelines/accessibility): descrever controles para tecnologias assistivas. | Adicionar nomes de ação e produto com aria-label; explicitar o estado dos controles de mostrar senha com aria-pressed. |
| G5. Erros de formulário não vinculados ao campo, posicionados absolutamente e sem quebra de linha. | [InputForm JSX](../src/components/ui/inputForm/index.jsx) e [CSS](../src/components/ui/inputForm/index.module.css), [InputMaskForm JSX](../src/components/ui/inputMaskForm/index.jsx) e [CSS](../src/components/ui/inputMaskForm/index.module.css), [SelectForm JSX](../src/components/ui/selectForm/index.jsx) e [CSS](../src/components/ui/selectForm/index.module.css). | [Accessibility — Vision](https://developer.apple.com/design/human-interface-guidelines/accessibility): informação perceptível; [Writing — Best practices](https://developer.apple.com/design/human-interface-guidelines/writing): orientação clara para erros. | ID estável, aria-invalid e aria-describedby; erro anunciado como alert e mantido no fluxo, com quebra de linha. Não depender só da borda vermelha. |
| G6. Quatro modais declaravam aria-modal, mas não isolavam o fundo nem controlavam/restauravam o foco. | [produtos da comanda](../src/components/modals/produtosComanda/index.jsx), [venda rápida](../src/components/modals/vendaRapida/index.jsx), [leitor QR](../src/components/public/QrScannerModal.jsx), [carrinho público](../src/app/m/[token]/cardapio/CardapioMesaClient.jsx). Novo [hook](../src/hooks/useModalAccessibility.js) e [controle de foco](../src/lib/modal-focus.mjs). | [Accessibility — keyboard interaction](https://developer.apple.com/design/human-interface-guidelines/accessibility) e [Modality](https://developer.apple.com/design/human-interface-guidelines/modality): restringir a interação à tarefa modal. | Foco inicial dentro do modal; Tab/Shift+Tab contidos; fundo inert; Escape conforme a etapa; restaurar foco e rolagem ao fechar. Preservar os anúncios do Toaster e deixar o SweetAlert controlar sua própria confirmação. |
| G7. Alvos de toque: remoção no carrinho com 30 px, paginação com 36 px, ícones do header sem área mínima. | [globals.css](../src/app/globals.css), [Header CSS](../src/components/header/Header.module.css), [paginação CSS](../src/components/ui/pagination/index.module.css), [produtos CSS](../src/components/modals/produtosComanda/index.module.css), [venda CSS](../src/components/modals/vendaRapida/index.module.css). | [Accessibility — Mobility](https://developer.apple.com/design/human-interface-guidelines/accessibility): controles de tamanho suficiente. | Área mínima de 44 CSS px para botões em dispositivos de ponteiro impreciso; altura mínima de 44 px para campos e selects. É uma adaptação web da referência de toque da Apple; o ícone pode permanecer menor. |
| G8. Movimento: animações e transições de vários componentes ignoravam a preferência do usuário. | [globals.css](../src/app/globals.css), consumidores como [QR CSS](../src/components/public/QrScannerModal.module.css), [ActionMenu CSS](../src/components/ui/actionMenu/index.module.css) e [venda CSS](../src/components/modals/vendaRapida/index.module.css). | [Motion — Accessibility](https://developer.apple.com/design/human-interface-guidelines/motion): respeitar redução de movimento. | Regra global prefers-reduced-motion que remove animações, transições e rolagem suave. Estados de carregamento continuam identificados por texto. |
| G9. Texto a 200% cortava campos/erros; parte do menu móvel fechado escapava para a tela e seus links permaneciam focáveis. | [formulário de categorias CSS](../src/components/forms/categoriasAlimentos/index.module.css), demais CSS em components/forms, [campos compartilhados](../src/components/ui/inputForm/index.module.css), [admin layout CSS](../src/components/layouts/adminLayoutClient/adminLayout.module.css), [Sidebar CSS](../src/components/sidebar/Sidebar.module.css). | [Typography — Supporting Dynamic Type](https://developer.apple.com/design/human-interface-guidelines/typography) e [Layout — Adaptability](https://developer.apple.com/design/human-interface-guidelines/layout): acomodar ampliação do texto. | Tracks minmax(0,1fr), campos com min-width:0, botões com altura flexível e quebra de linha, menor margem externa móvel. Sidebar fechado usa visibility:hidden e pointer-events:none. No navegador, a validação usa tamanho de texto ampliado; não é Dynamic Type nativo. |

## 2. MÉDIO — pendente

| Item | Arquivo | Regra HIG | Fix concreto |
|---|---|---|---|
| M1. Legendas de 0,62–0,67 rem nas comandas e 0,72 rem nos produtos ficam pequenas em uma operação de balcão. | [ComandaCard CSS](../src/components/comandas/ComandaCard/index.module.css), [produtos CSS](../src/components/modals/produtosComanda/index.module.css), [venda CSS](../src/components/modals/vendaRapida/index.module.css). | [Typography — Ensuring legibility](https://developer.apple.com/design/human-interface-guidelines/typography). | Definir uma escala de texto: corpo 1rem, secundário 0,875rem; reduzir pesos de 800/850 em informação secundária. Validar em tela e distância reais do balcão. Os tamanhos são recomendação para este produto. |
| M2. Reset mantém line-height:1 como padrão geral; textos sem regra local ficam apertados. | [globals.css](../src/app/globals.css). | [Typography — Ensuring legibility](https://developer.apple.com/design/human-interface-guidelines/typography). | Usar line-height:1.45 no corpo e 1.15–1.25 em títulos; manter regras específicas das tabelas e controles onde necessário. |
| M3. Títulos dos modais têm tamanho maior, mas não explicitam peso após o reset de headings. | [produtos CSS](../src/components/modals/produtosComanda/index.module.css), [venda CSS](../src/components/modals/vendaRapida/index.module.css), [QR CSS](../src/components/public/QrScannerModal.module.css). | [Typography — Conveying hierarchy](https://developer.apple.com/design/human-interface-guidelines/typography). | Definir título com font-weight:700 e line-height:1.2; manter descrição em tamanho/peso secundário, com espaçamento separado. |
| M4. Espaçamentos locais usam .8rem, .95rem, 1.25rem, 14px e 16px para contextos semelhantes. | [ComandaCard CSS](../src/components/comandas/ComandaCard/index.module.css), [produtos CSS](../src/components/modals/produtosComanda/index.module.css), [venda CSS](../src/components/modals/vendaRapida/index.module.css), [formulários](../src/components/forms/forms.module.css). | [Layout — Visual hierarchy](https://developer.apple.com/design/human-interface-guidelines/layout): alinhamento e agrupamento. | Criar tokens de espaço e padronizar alinhamentos de títulos, campos e ações entre telas. Sugestão inicial: 4/8/12/16/24/32 px. A divergência é uma inferência de consistência, não violação de uma grade numérica obrigatória da Apple. |
| M5. Nomes de cliente/produto são truncados em desktop, dificultando distinguir nomes parecidos. | [ComandaCard CSS](../src/components/comandas/ComandaCard/index.module.css), [produtos CSS](../src/components/modals/produtosComanda/index.module.css), [venda CSS](../src/components/modals/vendaRapida/index.module.css). | [Typography — Supporting Dynamic Type](https://developer.apple.com/design/human-interface-guidelines/typography): minimizar truncamento. | Permitir duas linhas e expansão em texto maior; preservar preço em coluna própria. Usar minmax nas colunas fixas para acomodar nomes e preços longos. |

## 3. FINO — pendente

Estes itens são refinamentos de consistência inferidos da HIG; não bloqueiam o uso do produto.

| Item | Arquivo | Regra HIG relacionada | Fix concreto |
|---|---|---|---|
| F1. Raios de 6/7/8/9/14 px dão variações pouco justificadas entre controles semelhantes. | [ActionMenu CSS](../src/components/ui/actionMenu/index.module.css), [produtos CSS](../src/components/modals/produtosComanda/index.module.css), [venda CSS](../src/components/modals/vendaRapida/index.module.css). | [Layout — Visual hierarchy](https://developer.apple.com/design/human-interface-guidelines/layout): estrutura reconhecível e consistente. | Tokens por função: controle 8px, card 12px e modal 16px; manter exceções como badges e avatares. A HIG não obriga esses valores. |
| F2. Capitalização varia entre “Venda Rápida”, “Enviar pedido”, “Entrar no Sistema” e labels em caixa alta. | [login](../src/app/(auth)/login/page.jsx) e [CSS](../src/app/(auth)/login/page.module.css), [venda rápida](../src/components/modals/vendaRapida/index.jsx), [Header](../src/components/header/Header.jsx). | [Writing — Best practices](https://developer.apple.com/design/human-interface-guidelines/writing): aplicar padrões de linguagem e capitalização. | Padronizar “Venda rápida”, “Entrar no sistema”, “Alternar tema”; usar caixa de frase nos labels e reservar caixa alta à marca. |
| F3. Ícones de 16/17/18/19/20/22 px variam sem uma escala explícita; pesos de texto 750/800/850 contrastam com traço uniforme dos ícones. | [venda rápida](../src/components/modals/vendaRapida/index.jsx), [produtos da comanda](../src/components/modals/produtosComanda/index.jsx), [Header](../src/components/header/Header.jsx). | [Icons — Best practices](https://developer.apple.com/design/human-interface-guidelines/icons): consistência e compatibilidade de peso. | Escala de 16px inline, 20px ação e 24px navegação; ajustar strokeWidth conforme o peso do texto e alinhamento óptico. Lucide pode ser mantido na versão web. |
| F4. Preços/subtotais dos modais não têm o mesmo tratamento de números tabulares já usado nas comandas. | [produtos CSS](../src/components/modals/produtosComanda/index.module.css), [venda CSS](../src/components/modals/vendaRapida/index.module.css), referência em [ComandaCard CSS](../src/components/comandas/ComandaCard/index.module.css). | [Layout — Visual hierarchy](https://developer.apple.com/design/human-interface-guidelines/layout): facilitar leitura por alinhamento. | Aplicar font-variant-numeric:tabular-nums e alinhar valores à direita nas colunas de preço e subtotal. |

## Validação e limites

Resultado final: **103 testes passaram**, build de produção passou com BACKEND_URL local e a verificação de navegador passou. O lint geral mantém **21 erros e 3 avisos existentes**; a comparação dos arquivos alterados com a base confirmou **zero problemas introduzidos**. A revisão de código checou os fixes antes da publicação.

- Testes automatizados de contraste verificam temas claro/escuro, botões e faixas de status.
- Testes no Edge com dados simulados verificam login por teclado, ordenação com Enter/Space, foco/Tab/Escape/restauração nos modais QR e venda rápida, preservação do Toaster e erros de formulário com texto a 200%.
- Revisão visual feita em 390×844 e teste de tabela em 1280×900. As capturas locais estão em auditoria-hig/hig-evidence.
- O mesmo helper de foco foi integrado ao modal de produtos e ao carrinho público; esses dois fluxos não receberam uma execução ponta a ponta com dados reais.
- Não foram realizados testes com VoiceOver/Safari em dispositivo Apple nem operações reais de venda, pagamento ou câmera.
- Os ajustes MÉDIO e FINO não foram aplicados.
- O backend não foi alterado, pois os problemas encontrados estão na apresentação do frontend.
- O instalador de dependências reportou 3 vulnerabilidades (2 high, 1 critical). Atualização de dependências não faz parte destes fixes de design.
- Next dev gerou AGENTS.md e CLAUDE.md locais. Eles não fazem parte da correção publicada.

### Como reproduzir

Execute na pasta comandas-lanchonete-frontend:

    npm ci
    npm test
    BACKEND_URL=http://localhost:3001 npm run build
    npm run dev -- --port 3100
    node scripts/verify-hig.cjs

No Windows/PowerShell, defina BACKEND_URL como variável de ambiente antes do build. O teste de navegador usa Playwright e o canal msedge; se Playwright não estiver instalado no projeto, PLAYWRIGHT_MODULE pode indicar o módulo fornecido pelo ambiente.

### Arquivos alterados

Os consumidores de background/confirmButtonColor foram migrados mecanicamente para tokens de ação para que a correção do tema escuro seja consistente. Não houve mudanças de API ou no processamento dos pedidos.


- `src/app/(auth)/forgot/page.module.css`
- `src/app/(auth)/login/page.jsx`
- `src/app/(auth)/login/page.module.css`
- `src/app/(auth)/reset/[token]/page.jsx`
- `src/app/(auth)/reset/[token]/page.module.css`
- `src/app/[...catchAll]/page.module.css`
- `src/app/admin/alimentos/AlimentosClient.jsx`
- `src/app/admin/alimentos/AlimentosClient.module.css`
- `src/app/admin/alimentos/[id]/ProdutoDetalhesClient.jsx`
- `src/app/admin/alimentos/[id]/page.module.css`
- `src/app/admin/alimentos/cadastro/page.jsx`
- `src/app/admin/alimentos/cadastro/page.module.css`
- `src/app/admin/categorias/CategoriasClient.jsx`
- `src/app/admin/categorias/CategoriasClient.module.css`
- `src/app/admin/categorias/[id]/page.jsx`
- `src/app/admin/comandas/ComandasClient.module.css`
- `src/app/admin/comandas/[id]/ComandaDetalhesClient.jsx`
- `src/app/admin/comandas/[id]/page.module.css`
- `src/app/admin/comandas/cadastro/page.jsx`
- `src/app/admin/configuracoes/ConfiguracoesClient.jsx`
- `src/app/admin/configuracoes/ConfiguracoesClient.module.css`
- `src/app/admin/cozinha/CozinhaClient.jsx`
- `src/app/admin/cozinha/page.module.css`
- `src/app/admin/mesas/MesasClient.jsx`
- `src/app/admin/mesas/MesasClient.module.css`
- `src/app/admin/mesas/[id]/MesaDetalhesClient.jsx`
- `src/app/admin/mesas/[id]/page.module.css`
- `src/app/admin/mesas/cadastro/page.jsx`
- `src/app/admin/notificacoes/page.module.css`
- `src/app/admin/usuarios/UsuariosClient.jsx`
- `src/app/admin/usuarios/UsuariosClient.module.css`
- `src/app/admin/usuarios/[id]/permissoes/permissoes.module.css`
- `src/app/admin/vendas/VendasClient.jsx`
- `src/app/admin/vendas/[id]/VendaDetalhesClient.jsx`
- `src/app/admin/vendas/[id]/page.module.css`
- `src/app/cadastro-restrito/CadastroRestritoClient.jsx`
- `src/app/cadastro-restrito/CadastroRestritoClient.module.css`
- `src/app/globals.css`
- `src/app/m/[token]/cardapio/CardapioMesaClient.jsx`
- `src/app/m/[token]/cardapio/cardapio.module.css`
- `src/app/m/[token]/mesa.module.css`
- `src/app/page.module.css`
- `src/components/comandas/ComandaCard/index.module.css`
- `src/components/forms/categoriasAlimentos/index.module.css`
- `src/components/forms/comandas/index.module.css`
- `src/components/forms/forms.module.css`
- `src/components/forms/mesas/index.module.css`
- `src/components/forms/produtos/index.module.css`
- `src/components/forms/usuarios/index.module.css`
- `src/components/header/Header.jsx`
- `src/components/layouts/adminLayoutClient/adminLayout.module.css`
- `src/components/modals/produtosComanda/index.jsx`
- `src/components/modals/produtosComanda/index.module.css`
- `src/components/modals/vendaRapida/GlobalVendaRapida.jsx`
- `src/components/modals/vendaRapida/index.jsx`
- `src/components/modals/vendaRapida/index.module.css`
- `src/components/notifications/NotificationBell.module.css`
- `src/components/paineis/aberturaCaixa/index.module.css`
- `src/components/paineis/caixaAberto/index.module.css`
- `src/components/paineis/comandaMesa/index.jsx`
- `src/components/paineis/comandaMesa/index.module.css`
- `src/components/public/QrScannerModal.jsx`
- `src/components/public/QrScannerModal.module.css`
- `src/components/sidebar/Sidebar.module.css`
- `src/components/ui/actionMenu/index.jsx`
- `src/components/ui/inputForm/index.jsx`
- `src/components/ui/inputForm/index.module.css`
- `src/components/ui/inputMaskForm/index.jsx`
- `src/components/ui/inputMaskForm/index.module.css`
- `src/components/ui/pagination/index.jsx`
- `src/components/ui/selectForm/index.jsx`
- `src/components/ui/selectForm/index.module.css`
- `src/components/ui/table/index.jsx`
- `src/components/ui/table/index.module.css`
- `src/hooks/useCaixa.js`
- `src/hooks/useUsuarioPermissoes.js`

Novos: src/hooks/useModalAccessibility.js, src/lib/modal-focus.mjs, src/lib/hig-contrast.test.mjs e scripts/verify-hig.cjs.
