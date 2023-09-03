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
			<p>removip@removip.com.br</p>
			<p>(21)3040-2666</p>
		</div>
	)
}