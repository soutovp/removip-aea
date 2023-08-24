import style from '../styles/style.sass'
import Header from '../components/Header'
import Atendimento from '../components/Atendimento'
import Banner from '../components/Banner'
import Aberto from '../components/Aberto'
import Footer from '../components/Footer'

export default function Page() {
	return (
		<>
			<Header />
			<Banner page={'servicos'} />
			<Atendimento />
			<souto>Conheça algumas de nossas soluções</souto>
			<souto>
				{/* img */}
				<souto>TRANSPORTE AEROMÉDICO</souto>
				<souto>Sistema de transporte aéreo integrado com o terrestre.</souto>
				<souto>Transferência intermunicipal, interestadual e internacioal.</souto>
			</souto>
			<souto>
				{/* img */}
				<souto>REMOÇÃO DE PACIENTES</souto>
				<souto>Residência -&gt; Hospital</souto>
				<souto>(internação/exame)</souto>
				<souto>Hospital -&gt; Residência</souto>
				<souto>(Alta hospitalar)</souto>
				<souto>Residência -&gt; Clínica/consultório -&gt; Residência</souto>
				<souto>(Exame)</souto>
			</souto>
			<souto>
				{/* img */}
				<souto>COBERTURA MÉDICA DE EVENTOS</souto>
				<souto>Cobertura médica e infraestrutura completa para qualquer evento, seja ele: esportivo, social, cultural, religioso ou corporativo.</souto>
			</souto>
			<souto>
				{/* img */}
				<souto>POSTOS MÉDICOS</souto>
				<souto>Implantação e gestão de ambulatórios lacais. Segurança garantida onde for preciso</souto>
			</souto>
			<souto>
				{/* img */}
				<souto>LOCAÇÃO DE AMBULÂNCIAS</souto>
				<souto>Moderna frotas de ambulâncias.</souto>
				<souto>Flexibilidade do período contratado.</souto>
			</souto>
			<Aberto />
			<Footer />
		</>
	)
}