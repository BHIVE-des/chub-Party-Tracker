import { ReactElement, useState, useEffect } from "react";

interface DeleteButtonProps {
    onConfirm: () => void;
    small?: boolean;
}

// How long the "Confirm?" state lasts before reverting to "Delete"
const CONFIRM_TIMEOUT_MS = 3000;

/***
 Delete button that needs a second click to confirm.
 (window.confirm() isn't reliable inside the stage's iframe.)
 ***/
export function DeleteButton({ onConfirm, small = false }: DeleteButtonProps): ReactElement {
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        if (!confirming) return;
        const timer = setTimeout(() => setConfirming(false), CONFIRM_TIMEOUT_MS);
        return () => clearTimeout(timer);
    }, [confirming]);

    const baseColor = confirming ? '#8a3a3a' : '#5a2a2a';

    return (
        <button
            onClick={() => {
                if (confirming) {
                    setConfirming(false);
                    onConfirm();
                } else {
                    setConfirming(true);
                }
            }}
            title={confirming ? "Click again to permanently delete" : "Delete"}
            style={{
                backgroundColor: baseColor,
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: small ? '4px 10px' : '6px 12px',
                cursor: 'pointer',
                fontSize: small ? '11px' : '12px',
                fontWeight: confirming ? 600 : 400,
                transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#8a3a3a';
                e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = baseColor;
                e.currentTarget.style.transform = 'scale(1)';
            }}
        >
            {confirming ? 'Confirm?' : 'Delete'}
        </button>
    );
}
