import React, { useState } from 'react';

export default function ClientOnly() {
	const [openMenu, setMenuOpen] = useState(false);
	const toggleMenu = () => {
		setMenuOpen(!openMenu);
	};

	return (
		<>

		</>
	);
}
