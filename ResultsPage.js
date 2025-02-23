import React, { useState } from "react";
import { Chart as ChartJS, defaults } from "chart.js/auto";
import { Bar, Doughnut } from "react-chartjs-2";
import DataTable from "react-data-table-component";

// Default chart configurations
defaults.maintainAspectRatio = false;
defaults.responsive = true;

defaults.plugins.title.display = true;
defaults.plugins.title.align = "start";
defaults.plugins.title.font.size = 20;
defaults.plugins.title.color = "black";

const parseData = (data) => {
  const sourceData = [];
  const frequencyData = {};
  const totalHours = 24; // Total hours available for studying
  let totalFrequency = 0;

  // Calculate total frequency across all concepts
  for (const [topic, subcategories] of Object.entries(data)) {
    for (const [concept, frequency] of Object.entries(subcategories)) {
      totalFrequency += frequency;
    }
  }

  // Prepare data for charts and table
  const studyData = [];
  for (const [topic, subcategories] of Object.entries(data)) {
    // Add topic to sourceData
    sourceData.push({
      label: topic,
      value: Object.keys(subcategories).length,
    });

    // Add subcategories to frequencyData
    frequencyData[topic] = Object.entries(subcategories).map(([label, frequency]) => {
      // Calculate study hours for each concept
      const hours = (frequency / totalFrequency) * totalHours;
      studyData.push({ topic: label, hours: Math.round(hours * 10) / 10 }); // Round to 1 decimal place
      return { label, frequency };
    });
  }

  return { sourceData, frequencyData, studyData };
};

const ResultsPage = ({ textOutput }) => {
  console.log("Received textOutput:", textOutput);
  const [selectedTopic, setSelectedTopic] = useState(null);

  // State for sorting configuration
  const [sortConfig, setSortConfig] = useState({
    key: "hours", // Default sort by "hours"
    direction: "descending", // Default sort direction
  });

  // Example dictionary
  const dataDictionary = {
    Derivatives: { "Derivatives of Trig Functions": 0 },
    "Applications of Integration": {
      "Area of Surface of Revolution": 1,
      "Arc Length": 1,
      "Volume of Solids": 2,
    },
    "Series and Sequences": {
      "Maclaurin Series": 1,
      "Taylor Series": 2,
      "Convergence of Series": 2,
      "Power Series": 1,
    },
    Other: {
      "Partial Fraction Decomposition": 1,
      "Parametric Equations": 1,
      "Polar Coordinates": 1,
    },
  };

  const { sourceData, frequencyData, studyData: initialStudyData } = parseData(dataDictionary);

  // Function to handle sorting
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Sort studyData based on sortConfig
  const sortedStudyData = React.useMemo(() => {
    const sortableData = [...initialStudyData];
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [initialStudyData, sortConfig]);

  // Function to get the right dataset based on the selected topic
  const getFrequencyData = (topic) => {
    return frequencyData[topic] || [];
  };

  // Handle Doughnut chart click
  const handleDoughnutClick = (event, elements) => {
    if (elements.length > 0) {
      const clickedIndex = elements[0].index;
      const clickedLabel = sourceData[clickedIndex].label;
      setSelectedTopic((prevTopic) => (prevTopic === clickedLabel ? null : clickedLabel));
    }
  };

  // Columns for the Study Topics Table
  const studyColumns = [
    {
      name: "Topic",
      selector: (row) => row.topic,
      sortable: true,
    },
    {
      name: "Hours",
      selector: (row) => row.hours,
      sortable: true,
    },
  ];

  return (
    <div className="results-page">
      {/* Upper half of the screen */}
      <div className="upper-half">
        {textOutput && (
          <div className="text-output">
            <h2>Summary Output</h2>
            <pre>{textOutput}</pre>
          </div>
        )}
      </div>

      {/* Lower half of the screen */}
      <div className="lower-half">
        <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
          {/* Doughnut Chart */}
          <div className="dataCard doughnutCard">
            <Doughnut
              data={{
                labels: sourceData.map((data) => data.label),
                datasets: [
                  {
                    label: "Count",
                    data: sourceData.map((data) => data.value),
                    backgroundColor: [
                      "rgba(43, 63, 229, 0.8)",
                      "rgba(250, 192, 19, 0.8)",
                      "rgba(253, 135, 135, 0.8)",
                    ],
                    borderColor: [
                      "rgba(43, 63, 229, 0.8)",
                      "rgba(250, 192, 19, 0.8)",
                      "rgba(253, 135, 135, 0.8)",
                    ],
                  },
                ],
              }}
              options={{
                plugins: {
                  title: {
                    text: "Topics Distribution",
                  },
                },
                maintainAspectRatio: false,
                responsive: true,
                onClick: handleDoughnutClick,
              }}
              width={400}
              height={400}
            />
          </div>

          {/* Bar Chart (Dynamically displayed based on selection) */}
          {selectedTopic && (
            <div className="dataCard barCard">
              <Bar
                data={{
                  labels: getFrequencyData(selectedTopic).map((data) => data.label),
                  datasets: [
                    {
                      label: selectedTopic,
                      data: getFrequencyData(selectedTopic).map((data) => data.frequency),
                      backgroundColor: "#064FF0",
                      borderColor: "#064FF0",
                    },
                  ],
                }}
                options={{
                  plugins: {
                    title: {
                      text: selectedTopic,
                    },
                  },
                  maintainAspectRatio: false,
                  responsive: true,
                }}
                width={500}
                height={400}
              />
            </div>
          )}
        </div>

        {/* Study Topics Table */}
        <div style={{ marginTop: "20px" }}>
          <DataTable
            title="Study Topics"
            columns={studyColumns}
            data={sortedStudyData} // Use sortedStudyData instead of studyData
            highlightOnHover
            pointerOnHover
            pagination
            paginationPerPage={5} // Show only 5 rows per page
            selectableRows
            expandableRows
            onSort={(selectedColumn, sortDirection) => {
              requestSort(selectedColumn.selector); // Trigger sorting when a column is clicked
            }}
            sortServer // Use custom sorting logic
            contextMessage={{
              singular: "topic studied",
              plural: "topics studied",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;