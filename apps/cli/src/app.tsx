import { useState } from "react";
import { Text, Box, useInput, Spacer } from "ink";

const App = () => {
  const [count, setCount] = useState(0);

  useInput((input, key) => {
    if (input === "q") {
      process.exit(0);
    }

    if (key.upArrow) {
      setCount((c) => c + 1);
    }

    if (key.downArrow) {
      setCount((c) => Math.max(0, c - 1));
    }
  });

  return (
    <Box flexDirection="column">
      <Text>Press arrows to change counter, "q" to quit</Text>
      <Text color="greenBright">Count: {count}</Text>
      <Spacer />
      <Text color="gray">Use ↑ ↓ keys</Text>
    </Box>
  );
};

export default App;
