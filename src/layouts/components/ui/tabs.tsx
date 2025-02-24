import {
  children,
  createSignal,
  For,
  type Component,
  type JSXElement,
} from "solid-js";

interface TabsProps {
  children: JSXElement;
}

export const Tabs: Component<TabsProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<number>(0);

  const tabs = children(() => props.children);
  const evaluatedTabs = () => tabs.toArray() as unknown as TabProps[];

  return (
    <div class="mx-auto w-full max-w-3xl">
      {/* Tab-Leiste */}
      <div class="mb-4 flex border-b">
        <For each={evaluatedTabs()}>
          {({ title }, index) => (
            <div class="flex-1 text-center">
              <button
                class="w-full border-b-2 px-4 py-2 transition-colors"
                classList={{
                  "font-bold border-gray-800": activeTab() === index(),
                  "border-transparent text-gray-600 hover:text-gray-800":
                    activeTab() !== index(),
                }}
                onClick={() => setActiveTab(index())}
              >
                {title}
              </button>
            </div>
          )}
        </For>
      </div>

      {/* Tab-Inhalt */}
      {evaluatedTabs()[activeTab()].children}
    </div>
  );
};

interface TabProps {
  title: string;
  children: JSXElement;
}
export const Tab: Component<TabProps> = (props) => {
  return props as unknown as JSXElement;
};
