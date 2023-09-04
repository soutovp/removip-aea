import aberto from '../styles/components/aberto.module.sass'
/**
 * Atendimento 24h

 * removip@removip.com.br

 * (21)3042-2666
 */
export default function Aberto({ className = null }) {
	return (
		<div className={`${aberto.aberto} ${className}`}>
			<h1>Atendimento 24h</h1>
			<a href="mailto:removip@removip.com.br"><p>removip@removip.com.br</p></a>
			<a href='tel: +552130402666'><p>(21)3040-2666</p></a>
		</div>
	)
}