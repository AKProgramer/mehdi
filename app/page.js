"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import zindigiLogo from "../public/zindgi logo.png";
import alfalahLogo from "../public/alfalah.png";
import jazzcashLogo from "../public/jazzcash.png";
import easypaisaLogo from "../public/easypaisa.svg";
import hblLogo from "../public/hbl.png";

const BANKS = [
  // Mobile wallets
  { id: "jazzcash", name: "JazzCash", badge: "JC", color: "#ED1C24", group: "Mobile Wallets", logo: jazzcashLogo },
  { id: "easypaisa", name: "Easypaisa", badge: "EP", color: "#00A651", group: "Mobile Wallets", logo: easypaisaLogo },
  { id: "nayapay", name: "NayaPay", badge: "NP", color: "#6C2EB9", group: "Mobile Wallets" },
  { id: "sadapay", name: "SadaPay", badge: "SP", color: "#6E41E2", group: "Mobile Wallets" },
  // Banks
  { id: "bank-alfalah", name: "Bank Alfalah", badge: "BAF", color: "#E31E24", group: "Banks", logo: alfalahLogo },
  { id: "hbl", name: "HBL", badge: "HBL", color: "#024430", group: "Banks", logo: hblLogo, logoScale: 0.35 },
  { id: "ubl", name: "UBL", badge: "UBL", color: "#003876", group: "Banks" },
  { id: "mcb", name: "MCB Bank", badge: "MCB", color: "#7A1F2B", group: "Banks" },
  { id: "meezan", name: "Meezan Bank", badge: "MZN", color: "#006B3F", group: "Banks" },
  { id: "allied", name: "Allied Bank", badge: "ABL", color: "#007A33", group: "Banks" },
  { id: "askari", name: "Askari Bank", badge: "AKB", color: "#014B3A", group: "Banks" },
  { id: "faysal", name: "Faysal Bank", badge: "FB", color: "#F7941D", group: "Banks" },
  { id: "al-habib", name: "Bank Al Habib", badge: "BAH", color: "#EE7623", group: "Banks" },
  { id: "scb", name: "Standard Chartered", badge: "SC", color: "#0473EA", group: "Banks" },
  { id: "nbp", name: "National Bank of Pakistan", badge: "NBP", color: "#00693E", group: "Banks" },
  { id: "bop", name: "Bank of Punjab", badge: "BOP", color: "#006747", group: "Banks" },
  { id: "soneri", name: "Soneri Bank", badge: "SNB", color: "#F58220", group: "Banks" },
];

const BANK_GROUPS = [...new Set(BANKS.map((bank) => bank.group))];

function BankBadge({ bank, className }) {
  return (
    <div
      className={`flex items-center justify-center rounded-md font-bold text-white leading-none shrink-0 ${className}`}
      style={{ backgroundColor: bank.color }}
    >
      {bank.badge}
    </div>
  );
}

// Uses the bank's real logo from /public when one has been matched for it
// (see the `logo` field on BANKS); otherwise falls back to the colored
// initials badge so every bank still has a mark even without an asset.
// `logoScale` lets an individual logo (e.g. HBL's wide, thick wordmark)
// sit at less than the full row height so it doesn't dwarf its neighbors.
function BankMark({ bank, heightClass, className = "" }) {
  if (bank.logo) {
    const scale = bank.logoScale ?? 1;
    return (
      <div className={`${heightClass} flex items-center shrink-0 ${className}`}>
        <Image
          src={bank.logo}
          alt={bank.name}
          style={{ height: `${scale * 100}%`, width: "auto" }}
          className="object-contain"
          priority
        />
      </div>
    );
  }
  return (
    <BankBadge
      bank={bank}
      className={`${heightClass} aspect-square text-[10px] ${className}`}
    />
  );
}

const ZIGZAG_TEETH = 64;

function buildZigzagPoints(edge) {
  // "top": peaks point up and away from the card, base sits on the card edge
  // "bottom": peaks point down and away from the card, base sits on the card edge
  const outer = edge === "top" ? 0 : 1;
  const inner = edge === "top" ? 1 : 0;
  const points = [];
  for (let i = 0; i <= ZIGZAG_TEETH; i++) {
    points.push(`${i},${i % 2 === 0 ? outer : inner}`);
  }
  return points.join(" ");
}

// A fine, low-amplitude stitched line rather than a bold filled band, so it
// reads as a subtle ticket-perforation accent instead of drawing attention.
function ZigzagBorder({ color, edge, className = "" }) {
  return (
    <svg
      className={`absolute left-0 right-0 w-full h-2 ${className}`}
      viewBox={`0 0 ${ZIGZAG_TEETH} 1`}
      preserveAspectRatio="none"
    >
      <polyline
        points={buildZigzagPoints(edge)}
        fill="none"
        stroke={color}
        strokeWidth="1.25"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formatAmountParts(value) {
  const num = Number(value);
  const safe = Number.isFinite(num) ? num : 0;
  const formatted = safe.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const [whole, decimals] = formatted.split(".");
  return { whole, decimals };
}

function formatDateTime(date) {
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const hoursPadded = hours.toString().padStart(2, "0");
  return `${day} ${month}, ${year}  |  ${hoursPadded}:${minutes} ${ampm}`;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function Home() {
  const receiptRef = useRef(null);
  const bankMenuRef = useRef(null);

  const [step, setStep] = useState("form");
  const [receiverName, setReceiverName] = useState("Ali Hassan");
  const [bankId, setBankId] = useState("bank-alfalah");
  const [isBankMenuOpen, setIsBankMenuOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [accountNumber, setAccountNumber] = useState("58405001931073");
  const [amount, setAmount] = useState("10000");
  const [trxDate, setTrxDate] = useState(() => new Date(2026, 6, 28, 21, 48));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const selectedBank = BANKS.find((bank) => bank.id === bankId) || BANKS[0];
  const { whole, decimals } = formatAmountParts(amount);
  const isFormValid =
    receiverName.trim().length > 0 &&
    accountNumber.trim().length > 0 &&
    Number(amount) > 0;

  const bankSearchQuery = bankSearch.trim().toLowerCase();
  const filteredBankGroups = BANK_GROUPS.map((group) => ({
    group,
    banks: BANKS.filter(
      (bank) =>
        bank.group === group &&
        bank.name.toLowerCase().includes(bankSearchQuery)
    ),
  })).filter(({ banks }) => banks.length > 0);

  useEffect(() => {
    if (isBankMenuOpen) setBankSearch("");
  }, [isBankMenuOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (bankMenuRef.current && !bankMenuRef.current.contains(event.target)) {
        setIsBankMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSave = async () => {
    setSaveError("");
    setIsSaving(true);

    const now = new Date();
    flushSync(() => {
      setTrxDate(now);
    });

    try {
      const html2canvas = (await import("html2canvas")).default;
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsSaving(false);
          setSaveError("Could not generate image. Please try again.");
          return;
        }

        const fileName = `zindigi-receipt-${now.getTime()}.png`;
        const file = new File([blob], fileName, { type: "image/png" });

        try {
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await Promise.race([
              navigator.share({ files: [file], title: "Transfer Receipt" }),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error("share timed out")), 20000)
              ),
            ]);
          } else {
            downloadBlob(blob, fileName);
          }
        } catch {
          downloadBlob(blob, fileName);
        } finally {
          setIsSaving(false);
        }
      }, "image/png");
    } catch (err) {
      console.error(err);
      setIsSaving(false);
      setSaveError("Something went wrong while saving the image.");
    }
  };

  if (step === "form") {
    return (
      <main className="min-h-screen bg-white flex justify-center">
        <div className="w-full max-w-md px-5 py-8 pb-28">
          {/* Logo */}
          <div className="flex justify-center mb-10">
            <div className="flex items-center gap-3">
              <Image
                src={zindigiLogo}
                alt="Zindigi"
                className="w-11 h-11 rounded-xl"
                priority
              />
              <span className="text-2xl font-bold tracking-tight text-black">
                ZINDIGI
              </span>
            </div>
          </div>

          <h1 className="text-black text-2xl font-bold mb-1">
            Transfer Details
          </h1>
          <p className="text-[#8a8a8a] text-sm mb-8">
            Enter the receiver&apos;s details, then continue to preview your
            receipt.
          </p>

          <div className="flex flex-col gap-6">
            <label className="flex flex-col gap-2">
              <span className="text-[#8a8a8a] text-sm">Receiver Name</span>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="border border-[#d7d7d7] rounded-xl px-4 py-3.5 text-black text-base focus:outline-none focus:ring-2 focus:ring-[#43c3c8]"
                placeholder="Receiver Name"
              />
            </label>

            {/* Bank Name dropdown with logos */}
            <div className="flex flex-col gap-2 relative" ref={bankMenuRef}>
              <span className="text-[#8a8a8a] text-sm">Bank Name</span>
              <button
                type="button"
                onClick={() => setIsBankMenuOpen((open) => !open)}
                aria-haspopup="listbox"
                aria-expanded={isBankMenuOpen}
                className="flex items-center gap-3 border border-[#d7d7d7] rounded-xl px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-[#43c3c8]"
              >
                <BankMark bank={selectedBank} heightClass="h-10" />
                <span className="flex-1 text-black text-base">
                  {selectedBank.name}
                </span>
                <svg
                  width="14"
                  height="9"
                  viewBox="0 0 14 9"
                  fill="none"
                  className={`shrink-0 transition-transform ${
                    isBankMenuOpen ? "rotate-180" : ""
                  }`}
                >
                  <path
                    d="M1 1L7 7L13 1"
                    stroke="#8a8a8a"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {isBankMenuOpen ? (
                <div className="absolute top-full left-0 right-0 z-20 mt-2 rounded-xl border border-[#d7d7d7] bg-white shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-[#eee]">
                    <div className="relative">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      >
                        <circle
                          cx="7"
                          cy="7"
                          r="5.5"
                          stroke="#8a8a8a"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M11 11L14.5 14.5"
                          stroke="#8a8a8a"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      <input
                        type="text"
                        value={bankSearch}
                        onChange={(e) => setBankSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setIsBankMenuOpen(false);
                        }}
                        placeholder="Search bank or wallet"
                        autoFocus
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#d7d7d7] text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#43c3c8]"
                      />
                    </div>
                  </div>

                  <ul role="listbox" className="max-h-64 overflow-y-auto">
                    {filteredBankGroups.length === 0 ? (
                      <li className="px-4 py-6 text-center text-sm text-[#8a8a8a]">
                        No banks or wallets found
                      </li>
                    ) : (
                      filteredBankGroups.map(({ group, banks }) => (
                        <li key={group}>
                          <div className="px-4 pt-3 pb-1 text-xs font-semibold text-[#8a8a8a] uppercase tracking-wide">
                            {group}
                          </div>
                          <ul>
                            {banks.map((bank) => (
                              <li key={bank.id} role="option">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBankId(bank.id);
                                    setIsBankMenuOpen(false);
                                  }}
                                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#f3ffff] ${
                                    bank.id === bankId ? "bg-[#f3ffff]" : ""
                                  }`}
                                >
                                  <BankMark bank={bank} heightClass="h-10" />
                                  <span className="text-black text-sm">
                                    {bank.name}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              ) : null}
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-[#8a8a8a] text-sm">Account Number</span>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="border border-[#d7d7d7] rounded-xl px-4 py-3.5 text-black text-base focus:outline-none focus:ring-2 focus:ring-[#43c3c8]"
                placeholder="Account Number"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[#8a8a8a] text-sm">Amount</span>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border border-[#d7d7d7] rounded-xl px-4 py-3.5 text-black text-base focus:outline-none focus:ring-2 focus:ring-[#43c3c8]"
                placeholder="Amount"
              />
            </label>
          </div>
        </div>

        {/* Sticky Next button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#eee] px-5 py-4">
          <div className="max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setStep("receipt")}
              disabled={!isFormValid}
              className="w-full py-4 rounded-full bg-gradient-to-br from-[#36c7c8] to-[#4398c5] text-white text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              Next
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex justify-center">
      <div className="w-full max-w-[989px] px-3 sm:px-6 py-8 sm:py-12">
        <button
          type="button"
          onClick={() => setStep("form")}
          className="flex items-center gap-2 text-[#43c3c8] font-medium mb-8"
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            <path
              d="M17 7H1M1 7L7 1M1 7L7 13"
              stroke="#43c3c8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Edit Details
        </button>

        <div ref={receiptRef} className="bg-white">
          {/* Logo */}
          <div className="flex justify-center mb-16 sm:mb-20">
            <div className="flex items-center gap-3">
              <Image
                src={zindigiLogo}
                alt="Zindigi"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl"
                priority
              />

              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
                ZINDIGI
              </span>
            </div>
          </div>

          {/* Success Icon */}
          <div className="flex flex-col items-center">
            <div className="relative flex items-center justify-center w-32 h-32 sm:w-48 sm:h-48 mb-6 sm:mb-10">
              <div className="absolute inset-0 rounded-full bg-[#e8fbfb]" />
              <div className="relative w-24 h-24 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-[#36c7c8] to-[#4398c5] flex items-center justify-center">
                <svg
                  className="w-14 h-11 sm:w-[78px] sm:h-[60px]"
                  viewBox="0 0 78 60"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 31L28 51L70 8"
                    stroke="white"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Success Message */}
            <h1 className="text-[#43c3c8] font-bold text-2xl sm:text-4xl mb-3 sm:mb-8">
              Transfer Successful!
            </h1>

            {/* Transaction Info */}
            <p className="text-[#d87836] text-xs sm:text-xl md:text-2xl font-medium text-center mb-6 sm:mb-12">
              {formatDateTime(trxDate)}
              <br className="sm:hidden" />
              <span className="hidden sm:inline">&nbsp; | &nbsp;</span>
              Trx ID: 357166014795507547931
            </p>
          </div>

          {/* Amount Card */}
          <section className="relative bg-[#f3ffff] border-x border-[#78d4d5] px-5 sm:px-12 py-8 sm:py-16 mb-14">
            <ZigzagBorder edge="top" color="#78d4d5" className="-top-[5px]" />
            <ZigzagBorder edge="bottom" color="#78d4d5" className="-bottom-[5px]" />

            {/* Main Amount */}
            <div className="text-center mb-6 sm:mb-10">
              <div className="text-black leading-none">
                <span className="text-xl sm:text-4xl font-semibold mr-1">
                  Rs.
                </span>
                <span className="text-4xl sm:text-8xl font-bold tracking-tight break-all">
                  {whole}
                </span>
                <span className="text-xl sm:text-4xl font-semibold">
                  .{decimals}
                </span>
              </div>
            </div>

            {/* Dashed Separator */}
            <div className="border-t-2 border-dashed border-[#58c8ca] mb-5 sm:mb-8" />

            {/* Amount */}
            <div className="space-y-3 sm:space-y-7">
              <div className="flex justify-between items-center text-black gap-3">
                <span className="text-sm sm:text-2xl font-medium shrink-0">
                  Amount
                </span>
                <span className="text-sm sm:text-2xl font-medium text-right break-all">
                  Rs. {whole}.{decimals}
                </span>
              </div>

              <div className="flex justify-between items-center text-black gap-3">
                <span className="text-sm sm:text-2xl font-medium">Fee</span>
                <span className="text-sm sm:text-2xl font-medium">
                  Rs. 0.00
                </span>
              </div>
            </div>
          </section>

          {/* Receiver / Sender Card */}
          <section className="relative border-x border-[#d7d7d7] px-5 sm:px-12 py-8 sm:py-14">
            <ZigzagBorder edge="top" color="#d7d7d7" className="-top-[5px]" />

            {/* Receiver Name */}
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 sm:gap-6 mb-6 sm:mb-12">
              <span className="text-[#b9b9b9] text-sm sm:text-2xl">
                Receiver Name
              </span>
              <span className="text-black text-sm sm:text-2xl font-medium text-right">
                {receiverName || "—"}
              </span>
            </div>

            {/* Bank Name */}
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 sm:gap-6 mb-6 sm:mb-12">
              <span className="text-[#b9b9b9] text-sm sm:text-2xl">
                Bank Name
              </span>

              <div className="flex flex-col items-center">
                <BankMark
                  bank={selectedBank}
                  heightClass={
                    selectedBank.logo
                      ? "h-10 sm:h-12"
                      : "w-10 h-10 sm:w-11 sm:h-11"
                  }
                />
                {!selectedBank.logo ? (
                  <span className="text-black text-xs sm:text-sm mt-1">
                    {selectedBank.name}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Account Number */}
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 sm:gap-6 mb-6 sm:mb-12">
              <span className="text-[#b9b9b9] text-sm sm:text-2xl">
                Account Number
              </span>
              <span className="text-black text-sm sm:text-2xl font-medium text-right">
                {accountNumber || "—"}
              </span>
            </div>

            {/* Middle Separator */}
            <div className="border-t-2 border-dashed border-[#bdbdbd] mb-6 sm:mb-12" />

            {/* Sender Name */}
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 sm:gap-6 mb-6 sm:mb-12">
              <span className="text-[#b9b9b9] text-sm sm:text-2xl">
                Sender Name
              </span>
              <span className="text-black text-sm sm:text-2xl font-medium text-right">
                Mehdi Hassan
              </span>
            </div>

            {/* Sender Account */}
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 sm:gap-6">
              <span className="text-[#b9b9b9] text-sm sm:text-2xl">
                Account Number
              </span>
              <span className="text-black text-sm sm:text-2xl font-medium text-right">
                0371 4051570
              </span>
            </div>

            <ZigzagBorder edge="bottom" color="#d7d7d7" className="-bottom-[5px]" />
          </section>
        </div>

        {/* Save / Download */}
        <div className="mt-10 flex flex-col items-center">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-10 py-4 rounded-full bg-gradient-to-br from-[#36c7c8] to-[#4398c5] text-white text-lg font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {isSaving ? "Saving..." : "Save to Gallery / Download"}
          </button>

          {saveError ? (
            <p className="text-red-500 text-sm mt-4">{saveError}</p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
