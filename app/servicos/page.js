import Atendimento from '../components/Atendimento'
import Banner from '../components/Banner'
import Aberto from '../components/Aberto'
import Souto from '../components/Souto'

export default function Page() {
	return (
		<>
			<Banner page={'servicos'} />
			<Atendimento />
			<Souto>Conheça algumas de nossas soluções</Souto>
			<Souto>
				{/* img */}
				<Souto>TRANSPORTE AEROMÉDICO</Souto>
				<Souto>Sistema de transporte aéreo integrado com o terrestre.</Souto>
				<Souto>Transferência intermunicipal, interestadual e internacioal.</Souto>
			</Souto>
			<Souto>
				{/* img */}
				<Souto>REMOÇÃO DE PACIENTES</Souto>
				<Souto>Residência -&gt; Hospital</Souto>
				<Souto>(internação/exame)</Souto>
				<Souto>Hospital -&gt; Residência</Souto>
				<Souto>(Alta hospitalar)</Souto>
				<Souto>Residência -&gt; Clínica/consultório -&gt; Residência</Souto>
				<Souto>(Exame)</Souto>
			</Souto>
			<Souto>
				{/* img */}
				<Souto>COBERTURA MÉDICA DE EVENTOS</Souto>
				<Souto>Cobertura médica e infraestrutura completa para qualquer evento, seja ele: esportivo, social, cultural, religioso ou corporativo.</Souto>
			</Souto>
			<Souto>
				{/* img */}
				<Souto>POSTOS MÉDICOS</Souto>
				<Souto>Implantação e gestão de ambulatórios lacais. Segurança garantida onde for preciso</Souto>
			</Souto>
			<Souto>
				{/* img */}
				<Souto>LOCAÇÃO DE AMBULÂNCIAS</Souto>
				<Souto>Moderna frotas de ambulâncias.</Souto>
				<Souto>Flexibilidade do período contratado.</Souto>
			</Souto>
			<Aberto />
		</>
	)
}