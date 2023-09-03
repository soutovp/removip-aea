import aberto from '../styles/components/aberto.module.sass'
export default function Aberto({ className = null }) {
	return (
		<div className={`${aberto.aberto} ${className}`}>
			<h1>Atendimento 24h</h1>
			<p>removip@removip.com.br</p>
			<p>(21)3040-2666</p>
		</div>
	)
}