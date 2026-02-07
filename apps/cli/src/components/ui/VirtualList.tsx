import React, {useState, useRef, useEffect, ReactNode} from 'react';
import {Text, Box, useInput, useStdout} from 'ink';

export type VirtualListItem<T = any> = T & {
	id: string | number;
};

export type RenderItemProps<T> = {
	item: T;
	index: number;
	isSelected: boolean;
	isVisible: boolean;
};

export type VirtualListProps<T> = {
	/** Массив данных любого типа */
	data: T[];
	/** Высота видимой области в строках */
	height?: number;
	/** Функция рендера каждого элемента */
	renderItem: (props: RenderItemProps<T>) => ReactNode;
	/** Ключ для идентификации элемента (по умолчанию 'id') */
	itemKey?: keyof T;
	/** Показать подсказки управления */
	showControlsHint?: boolean;
	/** Показать заголовок с информацией */
	showHeader?: boolean;
	/** Пользовательский обработчик выбора элемента */
	onSelect?: (item: T, index: number) => void;
	/** Начальный выбранный индекс */
	initialSelectedIndex?: number;
	/** Начальный offset скролла */
	initialScrollOffset?: number;
	/** Автоматически подстраивать высоту под размер терминала */
	autoHeight?: boolean;
	/** Отступ от края терминала при autoHeight */
	terminalMargin?: number;
	additionalHints?: string;
};

export function VirtualList<T>({
	data = [],
	height = 20,
	renderItem,
	itemKey = 'id' as keyof T,
	showControlsHint = true,
	showHeader = true,
	onSelect,
	initialSelectedIndex = 0,
	initialScrollOffset = 0,
	autoHeight = false,
	terminalMargin = 4,
	additionalHints = '',
}: VirtualListProps<T>) {
	const [scrollOffset, setScrollOffset] = useState(initialScrollOffset);
	const [selectedIndex, setSelectedIndex] = useState(
		data.length > 0 ? Math.min(initialSelectedIndex, data.length - 1) : -1,
	);
	const containerRef = useRef(null);
	const {stdout} = useStdout();
	const [terminalHeight, setTerminalHeight] = useState(Math.max(height, 1));

	useEffect(() => {
		if (autoHeight && stdout?.rows) {
			const actualHeight = stdout.rows - terminalMargin;
			setTerminalHeight(Math.max(actualHeight, 1));
		} else {
			setTerminalHeight(Math.max(height, 1));
		}
	}, [stdout?.rows, height, autoHeight, terminalMargin]);

	// Сброс выбранного индекса при изменении данных
	useEffect(() => {
		if (data.length === 0) {
			setSelectedIndex(-1);
		} else if (selectedIndex >= data.length) {
			setSelectedIndex(Math.max(0, data.length - 1));
		}
	}, [data.length, selectedIndex]);

	useInput((input, key) => {
		if (data.length === 0) return;

		if (key.upArrow) {
			setSelectedIndex(prev => {
				const newIndex = Math.max(0, prev - 1);

				if (newIndex < scrollOffset) {
					setScrollOffset(newIndex);
				}

				if (onSelect && newIndex !== prev && data[newIndex]) {
					onSelect(data[newIndex], newIndex);
				}

				return newIndex;
			});
		}

		if (key.downArrow) {
			setSelectedIndex(prev => {
				const newIndex = Math.min(data.length - 1, prev + 1);

				if (newIndex >= scrollOffset + terminalHeight) {
					setScrollOffset(Math.max(0, newIndex - terminalHeight + 1));
				}

				if (onSelect && newIndex !== prev && data[newIndex]) {
					onSelect(data[newIndex], newIndex);
				}

				return newIndex;
			});
		}

		if (key.pageUp) {
			const newOffset = Math.max(0, scrollOffset - terminalHeight);
			const newIndex = Math.min(
				newOffset + terminalHeight - 1,
				data.length - 1,
			);

			setScrollOffset(newOffset);
			setSelectedIndex(newIndex);

			if (onSelect && data[newIndex]) {
				onSelect(data[newIndex], newIndex);
			}
		}

		if (key.pageDown) {
			const newOffset = Math.min(
				Math.max(0, data.length - terminalHeight),
				scrollOffset + terminalHeight,
			);
			const newIndex = Math.max(newOffset, 0);

			setScrollOffset(newOffset);
			setSelectedIndex(newIndex);

			if (onSelect && data[newIndex]) {
				onSelect(data[newIndex], newIndex);
			}
		}

		if (key.home) {
			setScrollOffset(0);
			setSelectedIndex(0);

			if (onSelect && data[0]) {
				onSelect(data[0], 0);
			}
		}

		if (key.end) {
			const newOffset = Math.max(0, data.length - terminalHeight);
			const newIndex = data.length - 1;

			setScrollOffset(newOffset);
			setSelectedIndex(newIndex);

			if (onSelect && data[newIndex]) {
				onSelect(data[newIndex], newIndex);
			}
		}

		if (input === ' ' || key.rightArrow) {
			const newOffset = Math.min(
				Math.max(0, data.length - terminalHeight),
				scrollOffset + terminalHeight,
			);
			const newIndex = Math.max(newOffset, 0);

			setScrollOffset(newOffset);
			setSelectedIndex(newIndex);

			if (onSelect && data[newIndex]) {
				onSelect(data[newIndex], newIndex);
			}
		}

		if (key.leftArrow) {
			const newOffset = Math.max(0, scrollOffset - terminalHeight);
			const newIndex = Math.min(
				newOffset + terminalHeight - 1,
				data.length - 1,
			);

			setScrollOffset(newOffset);
			setSelectedIndex(newIndex);

			if (onSelect && data[newIndex]) {
				onSelect(data[newIndex], newIndex);
			}
		}

		// Enter для выбора
		if (key.return && onSelect && selectedIndex >= 0 && data[selectedIndex]) {
			onSelect(data[selectedIndex], selectedIndex);
		}
	});

	// Видимый диапазон данных
	const visibleData = data.slice(scrollOffset, scrollOffset + terminalHeight);

	if (data.length === 0) {
		return (
			<Box borderStyle="single" borderColor="gray" padding={1}>
				<Text color="yellow">Нет данных для отображения</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" ref={containerRef}>
			{/* Виртуальный список */}
			<Box
				flexDirection="column"
				borderStyle="single"
				borderColor="gray"
				height={terminalHeight}
				overflow="hidden"
			>
				{visibleData.map((item, index) => {
					const absoluteIndex = scrollOffset + index;
					const isSelected = absoluteIndex === selectedIndex;

					return (
						<Box key={String(item[itemKey] ?? absoluteIndex)}>
							{renderItem({
								item,
								index: absoluteIndex,
								isSelected,
								isVisible: true,
							})}
						</Box>
					);
				})}
			</Box>

			{/* Заголовок с информацией о позиции */}
			{showHeader && (
				<Box>
					<Text color="cyan" bold>
						Показано {scrollOffset + 1}-
						{Math.min(scrollOffset + terminalHeight, data.length)} из{' '}
						{data.length}
					</Text>
					{selectedIndex >= 0 && (
						<>
							<Text> | </Text>
							<Text color="green">Выбрано: {selectedIndex + 1}</Text>
						</>
					)}
				</Box>
			)}

			{/* Подсказки по управлению */}
			{showControlsHint && (
				<Box marginTop={1}>
					<Text dimColor>
						↑↓ - Навигация | PgUp/PgDn - Быстрая прокрутка | Home/End - В
						начало/конец
						{onSelect && ' | Enter - Выбрать'}
						{additionalHints}
					</Text>
				</Box>
			)}
		</Box>
	);
}

// Пример компонента по умолчанию для отображения
export function DefaultItemRenderer<
	T extends {name?: string; description?: string; status?: string},
>({item, index, isSelected}: RenderItemProps<T>) {
	return (
		<Box paddingX={1} paddingY={0}>
			<Text color={isSelected ? 'white' : 'gray'}>
				{String(index + 1).padStart(4, '0')}
			</Text>
			<Text> </Text>
			<Text color={isSelected ? 'white' : undefined}>
				{item.name || `Item ${index + 1}`}
			</Text>
			<Text> </Text>
			{item.status && (
				<>
					<Text color="green" dimColor>
						[{item.status}]
					</Text>
					<Text> </Text>
				</>
			)}
			{item.description && <Text dimColor>{item.description}</Text>}
		</Box>
	);
}
