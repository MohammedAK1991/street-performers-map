import { useState } from "react";
import type { OnboardingData } from "../OnboardingWizard";

interface PerformanceTypeStepProps {
	data: OnboardingData;
	updateData: (data: Partial<OnboardingData>) => void;
	nextStep: () => void;
	prevStep: () => void;
}

const performanceTypes = [
	{
		id: "musician",
		name: "Musician",
		icon: "🎵",
		description: "Instruments, vocals, bands",
	},
	{
		id: "juggler",
		name: "Juggler",
		icon: "🤹",
		description: "Objects, fire, acrobatics",
	},
	{
		id: "magician",
		name: "Magician",
		icon: "🎩",
		description: "Magic tricks, illusions",
	},
	{ id: "dancer", name: "Dancer", icon: "💃", description: "All dance styles" },
	{
		id: "storyteller",
		name: "Storyteller",
		icon: "📚",
		description: "Stories, poetry, spoken word",
	},
	{
		id: "statue",
		name: "Living Statue",
		icon: "🗿",
		description: "Human statues, mimes",
	},
	{
		id: "puppeteer",
		name: "Puppeteer",
		icon: "🎭",
		description: "Puppet shows, marionettes",
	},
	{
		id: "circus",
		name: "Circus Arts",
		icon: "🎪",
		description: "Acrobatics, circus skills",
	},
	{
		id: "artist",
		name: "Visual Artist",
		icon: "🎨",
		description: "Drawing, painting, crafts",
	},
	{
		id: "comedian",
		name: "Comedian",
		icon: "😂",
		description: "Stand-up, comedy acts",
	},
	{
		id: "theatre",
		name: "Theatre",
		icon: "🎭",
		description: "Drama, performance art",
	},
	{ id: "other", name: "Other", icon: "✨", description: "Something unique" },
];

export function PerformanceTypeStep({
	data,
	updateData,
	nextStep,
	prevStep,
}: PerformanceTypeStepProps) {
	const [selectedTypes, setSelectedTypes] = useState<string[]>(
		data.performanceTypes || [],
	);
	const [primaryType, setPrimaryType] = useState<string>(
		data.primaryType || "",
	);

	const handleTypeToggle = (typeId: string) => {
		const newTypes = selectedTypes.includes(typeId)
			? selectedTypes.filter((t) => t !== typeId)
			: [...selectedTypes, typeId];

		setSelectedTypes(newTypes);

		// If deselecting the primary type, clear it
		if (!newTypes.includes(primaryType)) {
			setPrimaryType("");
		}
	};

	const handlePrimaryTypeChange = (typeId: string) => {
		setPrimaryType(typeId);

		// Ensure primary type is also selected
		if (!selectedTypes.includes(typeId)) {
			setSelectedTypes([...selectedTypes, typeId]);
		}
	};

	const canContinue = selectedTypes.length > 0 && primaryType;

	const handleNext = () => {
		updateData({
			performanceTypes: selectedTypes,
			primaryType: primaryType,
		});
		nextStep();
	};

	return (
		<div className="space-y-8">
			{/* Instructions */}
			<div className="text-center">
				<p className="text-gray-300 mb-6">
					Select all types that describe your performances.
					<br />
					<span className="text-sm text-gray-400">
						This will help audiences find you on our map.
					</span>
				</p>
			</div>

			{/* Performance Type Grid */}
			<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
				{performanceTypes.map((type) => (
					<button
						key={type.id}
						onClick={() => handleTypeToggle(type.id)}
						className={`p-4 rounded-lg border-2 transition-all text-left hover:scale-105 ${
							selectedTypes.includes(type.id)
								? "border-blue-500 bg-blue-900/20 text-blue-300"
								: "border-gray-600 hover:border-gray-500 bg-gray-800 text-white"
						}`}
					>
						<div className="text-2xl mb-2">{type.icon}</div>
						<h3 className="font-semibold text-sm mb-1">{type.name}</h3>
						<p className="text-xs text-gray-400">{type.description}</p>

						{selectedTypes.includes(type.id) && (
							<div className="mt-2">
								<div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
									<span className="text-white text-xs">✓</span>
								</div>
							</div>
						)}
					</button>
				))}
			</div>

			{/* Primary Type Selection */}
			{selectedTypes.length > 0 && (
				<div className="bg-blue-900/20 rounded-lg p-6 border border-blue-500/30">
					<h3 className="font-semibold text-white mb-4">
						🎯 Which is your primary performance type?
					</h3>
					<p className="text-sm text-gray-300 mb-4">
						This will be your main icon on the map and your profile.
					</p>

					<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
						{selectedTypes.map((typeId) => {
							const type = performanceTypes.find((t) => t.id === typeId)!;
							return (
								<button
									key={typeId}
									onClick={() => handlePrimaryTypeChange(typeId)}
									className={`p-3 rounded-lg border-2 transition-all ${
										primaryType === typeId
											? "border-blue-500 bg-blue-900/30 text-blue-300"
											: "border-gray-600 hover:border-blue-400 bg-gray-800 text-white"
									}`}
								>
									<div className="text-xl mb-1">{type.icon}</div>
									<div className="text-sm font-medium">{type.name}</div>
								</button>
							);
						})}
					</div>
				</div>
			)}

			{/* Primary Type Preview */}
			{primaryType && (
				<div className="text-center">
					<div className="inline-flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-500/30">
						<div className="text-2xl">
							{performanceTypes.find((t) => t.id === primaryType)?.icon}
						</div>
						<div>
							<div className="text-sm text-gray-300">
								This will be your icon
							</div>
							<div className="font-semibold text-white">
								{performanceTypes.find((t) => t.id === primaryType)?.name}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Navigation */}
			<div className="flex space-x-4 pt-4">
				<button
					onClick={prevStep}
					className="flex-1 bg-gray-700 text-gray-300 py-3 px-6 rounded-lg font-medium hover:bg-gray-600 transition-colors"
				>
					← Back
				</button>

				<button
					onClick={handleNext}
					disabled={!canContinue}
					className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
				>
					{canContinue ? "Continue →" : "Select Performance Type"}
				</button>
			</div>

			{/* Selected Count */}
			{selectedTypes.length > 0 && (
				<div className="text-center text-sm text-gray-400">
					{selectedTypes.length} type{selectedTypes.length !== 1 ? "s" : ""}{" "}
					selected
				</div>
			)}
		</div>
	);
}
