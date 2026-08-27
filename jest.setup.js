// jest.setup.js — shared global mocks for screen smoke tests.
// Every screen renders headlessly: animations become no-ops, lists render via
// FlatList, expo-router is stubbed, and Supabase resolves empty data so pages
// deterministically land on their empty/error states.

/* ------------------------------------------------------------------ */
/* react-native-reanimated — universal no-op mock                      */
/* ------------------------------------------------------------------ */
jest.mock("react-native-reanimated", () => {
  const React = require("react");
  const RN = require("react-native");

  // Chainable, callable stub for entering/exiting/layout builders
  // (ZoomInEasyDown.springify(), FadeInUp.duration(...).easing(...), etc.)
  const makeBuilder = () => {
    const fn = function builder() {};
    return new Proxy(fn, {
      get: (_t, prop) => {
        if (typeof prop !== "string") return undefined;
        return (..._args) => makeBuilder();
      },
      apply: () => makeBuilder(),
      set: () => true,
    });
  };

  const makeSharedValue = (initial) => ({ value: initial });

  const createAnimatedComponent = (Component) =>
    React.forwardRef(function AnimatedComponent(props, ref) {
      const { entering, exiting, layout, animatedProps, ...rest } = props;
      return React.createElement(Component, { ...rest, ref });
    });

  const Animated = new Proxy(
    {},
    {
      get: (_t, prop) => {
        if (prop === "createAnimatedComponent")
          return (Component) => createAnimatedComponent(Component);
        if (typeof prop === "string") {
          return createAnimatedComponent(RN[prop] ?? RN.View);
        }
        return undefined;
      },
    }
  );

  const Easing = new Proxy(
    {},
    {
      get: (_t, prop) => (...args) => args[0] ?? makeBuilder(),
    }
  );

  const mock = {
    __esModule: true,
    default: Animated,
    Animated,
    Easing,
    Extrapolation: { CLAMP: "clamp", EXTEND: "extend", IDENTITY: "identity" },
    useSharedValue: (v) => makeSharedValue(v),
    useAnimatedStyle: () => ({}),
    useDerivedValue: () => makeSharedValue(0),
    useAnimatedScrollHandler: () => () => {},
    useAnimatedGestureHandler: () => ({}),
    useAnimatedRef: () => ({ current: null }),
    useReducedMotion: () => false,
    useFrameCallback: () => {},
    interpolate: () => 0,
    interpolateColor: () => "transparent",
    interpolateNode: () => 0,
    withSpring: (_t, v) => v,
    withTiming: (_t, v) => v,
    withDelay: (_d, v) => v,
    withSequence: (...args) => args[args.length - 1],
    withRepeat: (_v, rep) => rep,
    withDecay: (_o, v) => v,
    cancelAnimation: () => {},
    runOnJS: (fn) => fn,
    runOnUI: (fn) => fn,
    measure: () => ({ x: 0, y: 0, width: 0, height: 0, pageX: 0, pageY: 0 }),
    processColor: () => 0,
    FadeIn: makeBuilder(),
    FadeInUp: makeBuilder(),
    FadeInDown: makeBuilder(),
    FadeOut: makeBuilder(),
    FadeOutUp: makeBuilder(),
    FadeOutDown: makeBuilder(),
    ZoomIn: makeBuilder(),
    ZoomInEasyDown: makeBuilder(),
    ZoomOut: makeBuilder(),
    SlideInUp: makeBuilder(),
    SlideOutUp: makeBuilder(),
    LinearTransition: makeBuilder(),
    SequencedTransition: makeBuilder(),
    JumpingTransition: makeBuilder(),
  };

  // Any other named export falls back to a harmless chainable builder.
  return new Proxy(mock, {
    get: (target, prop) => {
      if (prop in target) return target[prop];
      if (typeof prop === "string") return makeBuilder();
      return undefined;
    },
  });
});

/* ------------------------------------------------------------------ */
/* react-native-worklets — only scheduleOnRN is used in the app        */
/* ------------------------------------------------------------------ */
jest.mock("react-native-worklets", () => ({
  __esModule: true,
  scheduleOnRN: jest.fn((_fn, ..._args) => {}),
}));

/* ------------------------------------------------------------------ */
/* expo-notifications — no native module under Jest; pessimistic perms  */
/* ------------------------------------------------------------------ */
jest.mock("expo-notifications", () => ({
  __esModule: true,
  AndroidImportance: { DEFAULT: 3 },
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({
    granted: false,
    canAskAgain: true,
    status: "undetermined",
  })),
  requestPermissionsAsync: jest.fn(async () => ({
    granted: false,
    canAskAgain: true,
    status: "denied",
  })),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: null })),
  setNotificationChannelAsync: jest.fn(async () => {}),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
}));

/* ------------------------------------------------------------------ */
/* @sentry/react-native — no native bridge under Jest; capture is a spy */
/* ------------------------------------------------------------------ */
jest.mock("@sentry/react-native", () => ({
  __esModule: true,
  init: jest.fn(),
  captureException: jest.fn(),
}));

/* ------------------------------------------------------------------ */
/* react-native-keyboard-controller — no native module under Jest;     */
/* KeyboardAwareScrollView becomes a plain ScrollView, provider passes */
/* children through                                                    */
/* ------------------------------------------------------------------ */
jest.mock("react-native-keyboard-controller", () => {
  const React = require("react");
  const { ScrollView } = require("react-native");

  const MockKeyboardAwareScrollView = React.forwardRef(
    function MockKeyboardAwareScrollView(props, ref) {
      const { bottomOffset, ...rest } = props;
      void bottomOffset;
      return React.createElement(ScrollView, { ...rest, ref });
    },
  );

  return {
    __esModule: true,
    KeyboardProvider: ({ children }) => children ?? null,
    KeyboardAwareScrollView: MockKeyboardAwareScrollView,
  };
});

/* ------------------------------------------------------------------ */
/* @expo/ui/community/bottom-sheet — native sheet becomes a plain View */
/* that renders its children; ref methods are inert stubs              */
/* ------------------------------------------------------------------ */
jest.mock("@expo/ui/community/bottom-sheet", () => {
  const React = require("react");
  const RN = require("react-native");

  const sheetMethods = {
    snapToIndex: jest.fn(),
    snapToPosition: jest.fn(),
    expand: jest.fn(),
    collapse: jest.fn(),
    close: jest.fn(),
    forceClose: jest.fn(),
    present: jest.fn(),
    dismiss: jest.fn(),
  };

  const MockBottomSheet = React.forwardRef(function MockBottomSheet(
    { children },
    ref,
  ) {
    React.useImperativeHandle(ref, () => sheetMethods);
    return React.createElement(RN.View, null, children ?? null);
  });

  return {
    __esModule: true,
    default: MockBottomSheet,
    BottomSheet: MockBottomSheet,
    BottomSheetModal: MockBottomSheet,
    BottomSheetView: ({ children }) =>
      React.createElement(RN.View, null, children ?? null),
    BottomSheetScrollView: RN.ScrollView,
    BottomSheetFlatList: RN.FlatList,
    BottomSheetSectionList: RN.SectionList,
    BottomSheetTextInput: RN.TextInput,
    BottomSheetModalProvider: ({ children }) => children ?? null,
    useBottomSheet: () => sheetMethods,
  };
});

/* ------------------------------------------------------------------ */
/* @shopify/flash-list — render as FlatList so children appear         */
/* ------------------------------------------------------------------ */
jest.mock("@shopify/flash-list", () => {
  const React = require("react");
  const { FlatList } = require("react-native");

  const MockFlashList = React.forwardRef(function MockFlashList(props, ref) {
    const {
      estimatedItemSize,
      masonry,
      drawDistance,
      onBlankArea,
      ...listProps
    } = props;
    void estimatedItemSize;
    void masonry;
    void drawDistance;
    void onBlankArea;
    return React.createElement(FlatList, { ...listProps, ref });
  });

  return {
    __esModule: true,
    FlashList: MockFlashList,
    AnimatedFlashList: MockFlashList,
    MasonryFlashList: MockFlashList,
  };
});

/* ------------------------------------------------------------------ */
/* @animatereactnative/stagger — render children immediately           */
/* ------------------------------------------------------------------ */
jest.mock("@animatereactnative/stagger", () => ({
  __esModule: true,
  Stagger: ({ children }) => children ?? null,
}));

/* ------------------------------------------------------------------ */
/* react-native-gesture-handler — light stubs for Gesture/_detector    */
/* ------------------------------------------------------------------ */
jest.mock("react-native-gesture-handler", () => {
  const React = require("react");

  const gestureStub = () => {
    const fn = function gesture() {};
    return new Proxy(fn, {
      get: (_t, prop) => {
        if (typeof prop !== "string") return undefined;
        if (prop === "withRef") return gestureStub;
        return (..._args) => gestureStub();
      },
      apply: () => gestureStub(),
    });
  };

  const GestureProxy = new Proxy(
    {},
    {
      get: (_t, method) => (..._args) => gestureStub(),
    }
  );

  const GestureDetector = ({ children }) =>
    React.createElement(React.Fragment, null, children);

  return {
    __esModule: true,
    Gesture: GestureProxy,
    GestureDetector,
    GestureHandlerRootView: ({ children }) =>
      React.createElement(React.Fragment, null, children),
    RectButton: ({ children }) =>
      React.createElement(React.Fragment, null, children),
    BaseButton: ({ children }) =>
      React.createElement(React.Fragment, null, children),
  };
});

/* ------------------------------------------------------------------ */
/* react-native-safe-area-context — zero insets, plain Views           */
/* ------------------------------------------------------------------ */
jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");

  const insets = { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };

  return {
    __esModule: true,
    SafeAreaProvider: ({ children }) =>
      React.createElement(View, null, children),
    SafeAreaView: ({ children, ...props }) =>
      React.createElement(View, props, children),
    SafeAreaConsumer: ({ children }) => children(insets),
    SafeAreaViewMode: "padding",
    initialWindowMetrics: {
      frame,
      insets,
    },
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
  };
});

/* ------------------------------------------------------------------ */
/* expo-router — inert navigation + fixed route params                 */
/* ------------------------------------------------------------------ */
jest.mock("expo-router", () => {
  const nav = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    dismiss: jest.fn(),
    navigate: jest.fn(),
    canDismiss: jest.fn(() => true),
    canGoBack: jest.fn(() => true),
    setParams: jest.fn(),
  };

  const params = { id: "test-id" };

  return {
    __esModule: true,
    router: nav,
    useRouter: () => nav,
    useLocalSearchParams: () => params,
    useGlobalSearchParams: () => params,
    usePathname: () => "/test",
    useSegments: () => [],
    Link: ({ children }) => children,
    Redirect: null,
    Stack: {
      Screen: () => null,
      Protected: ({ children }) => children,
    },
    Tabs: {
      Screen: () => null,
    },
  };
});

/* ------------------------------------------------------------------ */
/* @/services/supabase — chainable client resolving empty results      */
/* ------------------------------------------------------------------ */
jest.mock("@/services/supabase", () => {
  // List queries resolve to []; .single()/.maybeSingle() resolve to null.
  // The array also carries a hidden `session` prop so authStore's
  // `({ data: { session }, error })` destructuring works.
  const makeResult = (single) => {
    const data = single ? null : [];
    if (!single) {
      Object.defineProperty(data, "session", {
        value: null,
        enumerable: false,
      });
      Object.defineProperty(data, "user", { value: null, enumerable: false });
    }
    return { data, error: null };
  };

  const makeChain = ({ single = false } = {}) => {
    const fn = function chain() {};
    return new Proxy(fn, {
      get: (_t, prop) => {
        if (prop === "then") {
          return (onFulfilled, onRejected) =>
            Promise.resolve(makeResult(single)).then(onFulfilled, onRejected);
        }
        if (prop === "catch") {
          return (onRejected) =>
            Promise.resolve(makeResult(single)).catch(onRejected);
        }
        if (prop === "finally") {
          return (cb) => Promise.resolve(makeResult(single)).finally(cb);
        }
        if (prop === "single" || prop === "maybeSingle") {
          return () => makeChain({ single: true });
        }
        if (typeof prop !== "string") return undefined;
        return makeChain({ single });
      },
      apply: () => makeChain({ single }),
      set: () => true,
    });
  };

  return { __esModule: true, supabase: makeChain() };
});

/* ------------------------------------------------------------------ */
/* @react-native-async-storage/async-storage — official jest mock      */
/* ------------------------------------------------------------------ */
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

/* ------------------------------------------------------------------ */
/* @react-native-community/netinfo                                     */
/* ------------------------------------------------------------------ */
jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => jest.fn()),
    fetch: jest.fn(async () => ({ isConnected: true, type: "wifi" })),
    useNetInfo: jest.fn(() => ({ isConnected: true, type: "wifi" })),
    configure: jest.fn(),
    getCurrentState: jest.fn(async () => ({ isConnected: true, type: "wifi" })),
    refresh: jest.fn(),
  },
}));

/* ------------------------------------------------------------------ */
/* lucide-react-native — ships untranspiled ESM; icons become Views    */
/* ------------------------------------------------------------------ */
jest.mock("lucide-react-native", () => {
  const React = require("react");
  const { View } = require("react-native");

  const Icon = React.forwardRef(function MockIcon(props, ref) {
    return React.createElement(View, { ...props, ref });
  });

  return new Proxy(
    { __esModule: true, default: Icon },
    {
      get: (target, prop) => {
        if (prop in target) return target[prop];
        if (typeof prop === "string") return Icon;
        return undefined;
      },
    }
  );
});

/* ------------------------------------------------------------------ */
/* expo-haptics — silent no-ops                                        */
/* ------------------------------------------------------------------ */
jest.mock("expo-haptics", () => ({
  __esModule: true,
  notificationAsync: jest.fn(async () => {}),
  impactAsync: jest.fn(async () => {}),
  selectionAsync: jest.fn(async () => {}),
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error",
  },
  ImpactFeedbackStyle: {
    Light: "light",
    Medium: "medium",
    Heavy: "heavy",
  },
}));

/* ------------------------------------------------------------------ */
/* expo-location — permission denied, no fix                           */
/* ------------------------------------------------------------------ */
jest.mock("expo-location", () => ({
  __esModule: true,
  requestForegroundPermissionsAsync: jest.fn(async () => ({
    status: "denied",
    granted: false,
  })),
  getCurrentPositionAsync: jest.fn(async () => {
    throw new Error("No location available");
  }),
  PermissionStatus: {
    GRANTED: "granted",
    DENIED: "denied",
    UNDETERMINED: "undetermined",
  },
  Accuracy: { Lowest: 1, Low: 2, Balanced: 3, High: 4, Highest: 5, BestForNavigation: 6 },
}));
