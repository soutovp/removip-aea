'use client'
import Image from "next/image"
import React, { useEffect, useState, useRef, useLayoutEffect } from "react"
import Link from "next/link"
import headerStyle from '../styles/components/header.module.sass'
export default function Header() {
	const [menuInfo, setMenuInfo] = useState({
		mobile: false,
		showHide: 'translateX(0px)',
	});

	const hamburger = useRef(null);
	const menu = useRef(null);

	useEffect(() => {
		const handleResize = () => {
			setMenuInfo((prevMenuInfo) => ({
				...prevMenuInfo,
				mobile: window.innerWidth <= 768,
			}));
		};

		window.addEventListener('resize', handleResize);
		handleResize(); // Estado inicial

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	useEffect(() => {
		if (!menuInfo.mobile) {
			setMenuInfo((prevMenuInfo) => ({
				...prevMenuInfo,
				showHide: 'translateX(0px)',
			}));
			hamburger.current.style.display = 'none';
		} else {
			setMenuInfo((prevMenuInfo) => ({
				...prevMenuInfo,
				showHide: 'translateX(-100%)',
			}));
			hamburger.current.style.display = 'block';
		}
	}, [menuInfo.mobile]);

	function openMenu() {
		if (menuInfo.mobile) {
			setMenuInfo((prevMenuInfo) => ({
				...prevMenuInfo,
				showHide: prevMenuInfo.showHide === 'translateX(0px)' ? 'translateX(-100%)' : 'translateX(0px)',
			}));
		}
	}
	return (
		<>
			<button ref={hamburger} className={headerStyle.hamburger} onClick={openMenu}>
				<svg width="32px" height="32px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M20 7L4 7" stroke='#791B28' strokeWidth="1.5" strokeLinecap="round" />
					<path d="M20 12L4 12" stroke='#791B28' strokeWidth="1.5" strokeLinecap="round" />
					<path d="M20 17L4 17" stroke='#791B28' strokeWidth="1.5" strokeLinecap="round" />
				</svg>
			</button>
			<div className={headerStyle.menu} ref={menu} style={{ transform: menuInfo.showHide }}>
				<nav className="headerNav widthLimitation">
					<div>
						<Image
							src={'/svg/removip-logo-header.svg'}
							width={120}
							height={50}
							alt="Logo Removip"
						/>
					</div>
					<div>
						<ul>
							<li>
								<Link className="headerActiveLink" href="/" onClick={openMenu}>Home</Link>
							</li>
							<li>
								<Link href="sobre" onClick={openMenu}>Sobre</Link>
							</li>
							<li>
								<Link href="servicos" onClick={openMenu}>Serviços</Link>
							</li>
							<li>
								<Link href="contato" onClick={openMenu}>Contato</Link>
							</li>
						</ul>
					</div>
					<div>
						<ul className="headerRedes">
							<li>
								<a href="https://www.instagram.com/removip_/" target="_blank" rel="noopener noreferrer">
									<Image src={'/svg/instagram.svg'} width={32} height={32} alt="Link para o Instagram" />
								</a>
							</li>
							<li>
								<a href="https://whatsa.me/5521970769075/?t=Ol%C3%A1" target="_blank"
									rel="noopener noreffer">
									<Image src={'/svg/whatsapp.svg'} width={32} height={32} alt="Link para o Whatsapp" />
								</a>
							</li>
						</ul>
					</div>
				</nav>
			</div>
		</>
	)
}