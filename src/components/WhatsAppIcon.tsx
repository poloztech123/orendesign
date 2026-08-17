import React from 'react';

const whatsappIconImg = 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg';

interface WhatsAppIconProps {
  className?: string;
}

export default function WhatsAppIcon({ className = "h-5 w-5" }: WhatsAppIconProps) {
  return (
    <img
      src={whatsappIconImg}
      alt="WhatsApp"
      className={`${className} object-contain`}
      id="whatsapp-official-icon"
    />
  );
}
