import { useEffect, useState } from "react";
import {
  makeStyles,
  Card,
  CardContent,
  CardHeader,
  List,
} from "@material-ui/core";
import { Element, NodeKind } from "@200ms/anchor-ui";
import { PluginProvider, usePluginContext } from "./Context";

export function PluginRenderer({ plugin }: any) {
  return (
    <PluginProvider plugin={plugin}>
      <RootRenderer />
    </PluginProvider>
  );
}

function RootRenderer() {
  const { plugin } = usePluginContext();
  const [children, setChildren] = useState<Array<Element>>([]);

  //
  // Wait for the initial render. Should be called exactly once per plugin.
  //
  useEffect(() => {
    //
    // Create the iframe plugin.
    //
    plugin.create();

    //
    // Register the root renderer.
    //
    plugin.onRenderRoot((c: Array<Element>) => {
      setChildren([...c]);
    });

    //
    // Remove the iframe and cleanup all state on shut down.
    //
    return () => {
      plugin.destroy();
    };
  }, [plugin]);

  return (
    <>
      {children.map((e) => (
        <ViewRenderer key={e.id} element={e} />
      ))}
    </>
  );
}

function ViewRenderer({ element }: { element: Element }) {
  const { plugin } = usePluginContext();

  //
  // Force rerender the view whenever the plugin asks for it.
  //
  const [viewData, setViewData] = useState<Element>(element);

  //
  // Reload state on props change.
  //
  useEffect(() => {
    setViewData(element);
  }, [element]);

  //
  // Rerender the component when needed.
  //
  useEffect(() => {
    plugin.onRender(viewData.id, (newViewData: Element) => {
      setViewData({
        ...newViewData,
      });
    });
  }, [plugin, setViewData]);

  const { id, props, style, kind } = viewData;
  switch (kind) {
    case NodeKind.View:
      return (
        <View
          id={id}
          props={props}
          style={style}
          children={viewData.children}
        />
      );
    case NodeKind.Text:
      return <Text props={props} style={style} children={viewData.children} />;
    case NodeKind.Table:
      return <Table props={props} style={style} />;
    case NodeKind.Image:
      return <Image props={props} style={style} children={viewData.children} />;
    case NodeKind.BalancesTable:
      return (
        <BalancesTable
          props={props}
          style={style}
          childrenRenderer={viewData.children}
        />
      );
    case NodeKind.BalancesTableHead:
      return <BalancesTableHead props={props} style={style} />;
    case NodeKind.BalancesTableContent:
      return (
        <BalancesTableContent
          props={props}
          style={style}
          childrenRenderer={viewData.children}
        />
      );
    case NodeKind.BalancesTableRow:
      return (
        <BalancesTableRow
          props={props}
          style={style}
          children={viewData.children}
        />
      );
    case NodeKind.BalancesTableFooter:
      return (
        <BalancesTableFooter
          props={props}
          style={style}
          children={viewData.children}
        />
      );
    case "raw":
      return <Raw text={viewData.text} />;
    default:
      console.error(viewData);
      throw new Error("unexpected view data");
  }
}

const useStyles = makeStyles((theme: any) => ({
  blockchainLogo: {
    width: "12px",
    color: theme.custom.colors.secondary,
  },
  blockchainCard: {
    backgroundColor: theme.custom.colors.nav,
    marginBottom: "12px",
    marginLeft: "12px",
    marginRight: "12px",
    borderRadius: "12px",
    boxShadow: "0px 0px 4px rgba(0, 0, 0, 0.15)",
  },
  cardHeaderRoot: {
    padding: "6px",
    paddingLeft: "16px",
    paddingRight: "16px",
    height: "36px",
  },
  cardHeaderTitle: {
    fontWeight: 500,
    fontSize: "14px",
  },
  cardHeaderContent: {
    color: theme.custom.colors.fontColor,
  },
  cardContentRoot: {
    padding: "0 !important",
  },
  cardListRoot: {
    padding: "0 !important",
  },
}));

export function BalancesTable({
  props,
  style,
  children,
  childrenRenderer,
}: any) {
  const classes = useStyles();
  return (
    <Card className={classes.blockchainCard} elevation={0}>
      {children ??
        childrenRenderer.map((c: Element) => (
          <ViewRenderer key={c.id} element={c} />
        ))}
    </Card>
  );
}

export function BalancesTableHead({ props, style }: any) {
  const { title, iconUrl } = props;
  const classes = useStyles();
  return (
    <CardHeader
      avatar={
        iconUrl ? (
          <img className={classes.blockchainLogo} src={iconUrl} />
        ) : undefined
      }
      title={title}
      classes={{
        root: classes.cardHeaderRoot,
        content: classes.cardHeaderContent,
        title: classes.cardHeaderTitle,
      }}
    />
  );
}

export function BalancesTableContent({
  props,
  style,
  children,
  childrenRenderer,
}: any) {
  const classes = useStyles();
  return (
    <CardContent classes={{ root: classes.cardContentRoot }}>
      <List classes={{ root: classes.cardListRoot }}>
        {children ??
          childrenRenderer.map((c: Element) => (
            <ViewRenderer key={c.id} element={c} />
          ))}
      </List>
    </CardContent>
  );
}

export function BalancesTableRow({ props, style, children }: any) {
  return (
    <div style={style}>
      {children.map((c: Element) => (
        <ViewRenderer key={c.id} element={c} />
      ))}
    </div>
  );
}

export function BalancesTableFooter({ props, style, children }: any) {
  return (
    <div style={style}>
      {children.map((c: Element) => (
        <ViewRenderer key={c.id} element={c} />
      ))}
    </div>
  );
}

function View({ id, props, style, children }: any) {
  const { plugin } = usePluginContext();
  const onClick = !props.onClick
    ? undefined
    : (_event) => {
        plugin.didClick(id);
      };
  return (
    <div style={style} onClick={onClick}>
      {children.map((c: Element) => (
        <ViewRenderer key={c.id} element={c} />
      ))}
    </div>
  );
}

function Table({ props, style, children }: any) {
  return <></>;
}

function Text({ props, children, style }: any) {
  style = {
    color: "#fff", // todo: inject theme into top level renderer and set provider?
    fontWeight: 500,
    ...style,
  };
  return (
    <p style={style}>
      {children.map((c: Element) => (
        <ViewRenderer key={c.id} element={c} />
      ))}
    </p>
  );
}

function Image({ props, style }: any) {
  return <img src={props.src} style={style} />;
}

function Raw({ text }: any) {
  return <>{text}</>;
}
