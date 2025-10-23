import React from "react";
import { cn } from "../lib/utils";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { IconBrandYoutubeFilled } from "@tabler/icons-react";


export function FeaturesSectionDemo() {
  const features = [
    {
      title: "AI-Powered Root Cause Analysis",
      description:
        "Advanced machine learning algorithms analyze alerts and logs to identify root causes in seconds, reducing diagnostic time by 80%.",
      skeleton: <SkeletonOne />,
      className:
        "col-span-1 lg:col-span-4 border-b lg:border-r dark:border-neutral-800",
    },
    {
      title: "Smart Ticket Management",
      description:
        "Automated ticket creation, intelligent categorization, and real-time tracking for seamless workflow management.",
      skeleton: <SkeletonTwo />,
      className: "border-b col-span-1 lg:col-span-2 dark:border-neutral-800",
    },
    {
      title: "Demo Video",
      description:
        "Watch our demo video to see how PSA Diagnostic Assistant streamlines your L2 support operations and accelerates issue resolution.",
      skeleton: <SkeletonThree />,
      className:
        "col-span-1 lg:col-span-3 lg:border-r dark:border-neutral-800",
    },
    {
      title: "Global Service Coverage",
      description:
        "24/7 diagnostic support across all PSA operations worldwide with intelligent routing and escalation management.",
      skeleton: <SkeletonFour />,
      className: "col-span-1 lg:col-span-3 border-b lg:border-none",
    },
  ];
  return (
    <div className="relative z-20 py-10 lg:py-40 max-w-7xl mx-auto">
      <div className="px-8">
        <h4 className="text-3xl lg:text-5xl lg:leading-tight max-w-5xl mx-auto text-center tracking-tight font-medium text-black dark:text-white">
          Everything you need for L2 Support Excellence
        </h4>

        <p className="text-sm lg:text-base max-w-2xl my-4 mx-auto text-neutral-500 text-center font-normal dark:text-neutral-300">
          From AI-powered diagnostics to automated ticket management, PSA Diagnostic Assistant provides the complete toolkit for efficient L2 operations.
        </p>
      </div>

      <div className="relative">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-6 lg:gap-0 mt-12 xl:border rounded-md dark:border-neutral-800">
          {features.map((feature) => (
            <FeatureCard key={feature.title} className={feature.className}>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
              <div className="h-full w-full relative">{feature.skeleton}</div>
            </FeatureCard>
          ))}
        </div>
      </div>
    </div>
  );
}

const FeatureCard = ({
  children,
  className,
}) => {
  return (
    <div className={cn(`p-4 sm:p-8 relative overflow-hidden`, className)}>
      {children}
    </div>
  );
};

const FeatureTitle = ({ children }) => {
  return (
    <p className="max-w-5xl mx-auto text-left tracking-tight text-black dark:text-white text-xl md:text-2xl md:leading-snug relative z-10">
      {children}
    </p>
  );
};

const FeatureDescription = ({ children }) => {
  return (
    <p
      className={cn(
        "text-sm md:text-base  max-w-4xl text-left mx-auto",
        "text-neutral-500 text-center font-normal dark:text-neutral-300",
        "text-left max-w-sm mx-0 md:text-sm my-2 relative z-10"
      )}
    >
      {children}
    </p>
  );
};

export const SkeletonOne = () => {
  return (
    <div className="relative flex py-8 px-2 gap-10 h-full">
      <div className="w-full p-5 mx-auto glass-card shadow-2xl group h-full">
        <div className="flex flex-1 w-full h-full flex-col space-y-2">
          <img
            src="/AI Powered Root Cause Analysis.png"
            alt="AI Powered Root Cause Analysis Interface"
            width={800}
            height={800}
            className="h-full w-full aspect-square object-cover object-left-top rounded-sm"
          />
        </div>
      </div>

      <div className="absolute bottom-0 z-40 inset-x-0 h-60 bg-gradient-to-t from-gray-100 dark:from-black via-gray-100 dark:via-black to-transparent w-full pointer-events-none" />
      <div className="absolute top-0 z-40 inset-x-0 h-60 bg-gradient-to-b from-gray-100 dark:from-black via-transparent to-transparent w-full pointer-events-none" />
    </div>
  );
};

export const SkeletonThree = () => {
  return (
    <a
      href="https://youtu.be/DSXEpc_suSg"
      target="_blank"
      className="relative flex gap-10 h-full group/image"
    >
      <div className="w-full mx-auto bg-transparent dark:bg-transparent group h-full">
        <div className="flex flex-1 w-full h-full flex-col space-y-2 relative">
          <IconBrandYoutubeFilled className="h-20 w-20 absolute z-10 inset-0 text-red-500 m-auto " />
          <img
            src="https://img.youtube.com/vi/DSXEpc_suSg/maxresdefault.jpg"
            alt="PSA Knowledge Base Demo"
            width={800}
            height={800}
            className="h-full w-full aspect-square object-cover object-center rounded-sm blur-none group-hover/image:blur-md transition-all duration-200"
          />
        </div>
      </div>
    </a>
  );
};

export const SkeletonTwo = () => {
  return (
    <div className="relative flex py-8 px-2 gap-10 h-full">
      <div className="w-full p-5 mx-auto glass-card shadow-2xl group h-full">
        <div className="flex flex-1 w-full h-full flex-col space-y-2">
          <img
            src="/Ticket Management.png"
            alt="Smart Ticket Management Interface"
            width={800}
            height={400}
            className="h-1/2 w-full object-cover object-left-top rounded-sm"
          />
          <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
          <img
            src="/Ticket Management 2.png"
            alt="Smart Ticket Management Interface - Additional View"
            width={800}
            height={400}
            className="h-1/2 w-full object-cover object-left-top rounded-sm"
          />
        </div>
      </div>

      <div className="absolute bottom-0 z-40 inset-x-0 h-60 bg-gradient-to-t from-gray-100 dark:from-black via-gray-100 dark:via-black to-transparent w-full pointer-events-none" />
      <div className="absolute top-0 z-40 inset-x-0 h-60 bg-gradient-to-b from-gray-100 dark:from-black via-transparent to-transparent w-full pointer-events-none" />
    </div>
  );
};

export const SkeletonFour = () => {
  return (
    <div className="relative flex gap-10 h-full min-h-[500px]">
      <div className="w-full mx-auto bg-transparent dark:bg-transparent group h-full">
        <div className="flex flex-1 w-full h-full flex-col space-y-2 relative">
          <div className="h-full w-full overflow-hidden rounded-sm">
            <Globe />
          </div>
        </div>
      </div>
    </div>
  );
};

export const Globe = () => {
  const chartRef = useRef(null);

  useEffect(() => {
    // Check if amCharts is loaded
    if (typeof window.am5 === "undefined") {
      console.error("amCharts not loaded");
      return;
    }

    // Create root element
    const root = window.am5.Root.new(chartRef.current);

    // Remove amCharts logo
    if (root._logo) {
      root._logo.dispose();
    }

    // Set themes
    root.setThemes([
      window.am5themes_Animated.new(root)
    ]);

    // Create the map chart
    const chart = root.container.children.push(
      window.am5map.MapChart.new(root, {
        panX: "none",
        panY: "none",
        projection: window.am5map.geoOrthographic(),
        paddingBottom: 20,
        paddingTop: 20,
        paddingLeft: 20,
        paddingRight: 20,
        wheelable: false
      })
    );

    // Create main polygon series for countries
    const polygonSeries = chart.series.push(
      window.am5map.MapPolygonSeries.new(root, {
        geoJSON: window.am5geodata_worldLow
      })
    );

    polygonSeries.mapPolygons.template.setAll({
      interactive: false
    });

    // Create series for background fill
    const backgroundSeries = chart.series.push(
      window.am5map.MapPolygonSeries.new(root, {})
    );
    backgroundSeries.mapPolygons.template.setAll({
      fill: root.interfaceColors.get("alternativeBackground"),
      fillOpacity: 0.1,
      strokeOpacity: 0
    });
    backgroundSeries.data.push({
      geometry: window.am5map.getGeoRectangle(90, 180, -90, -180)
    });

    // Create graticule series
    const graticuleSeries = chart.series.push(
      window.am5map.GraticuleSeries.new(root, {})
    );
    graticuleSeries.mapLines.template.setAll({
      strokeOpacity: 0.1,
      stroke: root.interfaceColors.get("alternativeBackground")
    });

    // Rotate animation
    chart.animate({
      key: "rotationX",
      from: 0,
      to: 360,
      duration: 30000,
      loops: Infinity
    });

    // Make stuff animate on load
    chart.appear(1000, 100);

    // Cleanup
    return () => {
      root.dispose();
    };
  }, []);

  return (
    <div
      ref={chartRef}
      style={{
        width: "100%",
        height: "500px",
        maxWidth: "100%",
        pointerEvents: "none"
      }}
    />
  );
};

export default FeaturesSectionDemo;
