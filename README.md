# KNX Smart Home with ThingsBoard & AI Assistant

A smart home IoT system integrating **KNX**, **ThingsBoard**, **MCP**, and a local **Ollama LLM** for real-time monitoring, device control, and Persian natural-language interaction.

The project implements a simulated KNX smart home, connects it to ThingsBoard through a locally deployed and customized ThingsBoard IoT Gateway, and provides an AI assistant capable of monitoring and controlling the smart home through natural-language commands.

## Features

* KNX-based smart home simulation
* Smart light control and status monitoring
* Motorized blind control and position monitoring
* Real-time room temperature monitoring
* ThingsBoard telemetry and RPC integration
* Web-based ThingsBoard dashboard
* ThingsBoard IoT Gateway with KNX connector
* Custom modification of the ThingsBoard KNX uplink converter
* ETS6 project configuration
* KNX Virtual simulation configuration
* Local MCP server for exposing smart-home operations to AI
* Local Ollama LLM
* Persian natural-language interaction
* AI-based light control and home status queries

## Architecture

```text
                         ┌──────────────────┐
                         │       User       │
                         │ Persian Commands │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │      Ollama      │
                         │     qwen3:4b     │
                         └────────┬─────────┘
                                  │ MCP
                                  ▼
                         ┌──────────────────┐
                         │    MCP Server    │
                         │    TypeScript    │
                         └────────┬─────────┘
                                  │ REST / RPC
                                  ▼
                         ┌──────────────────┐
                         │   ThingsBoard    │
                         │                  │
                         │ Telemetry / RPC  │
                         │ Dashboard        │
                         └────────▲─────────┘
                                  │ MQTT
                                  │
                         ┌────────┴─────────┐
                         │ ThingsBoard IoT  │
                         │     Gateway      │
                         │                  │
                         │  KNX Connector   │
                         │ Custom Converter │
                         │   Python venv    │
                         └────────┬─────────┘
                                  │ KNXnet/IP
                                  ▼
                         ┌──────────────────┐
                         │   KNX Virtual    │
                         │                  │
                         │ Light            │
                         │ Blind            │
                         │ Temperature      │
                         └──────────────────┘
```

## KNX Configuration

The KNX network is simulated using **KNX Virtual** and configured through **ETS6**.

The ETS6 and KNX Virtual project files used for the implementation are included in this repository under:

```text
knx/
├── ets6/
└── knx-virtual/
```

These files can be used to reproduce the KNX configuration and simulated smart-home environment used in the project.

### KNX Group Addresses

The ThingsBoard IoT Gateway maps the KNX Group Addresses to ThingsBoard telemetry and RPC operations.

#### Telemetry

| Value            | Group Address | DPT     |
| ---------------- | ------------- | ------- |
| Room Temperature | `0/0/7`       | `9.001` |
| Light State      | `0/0/2`       | `1.001` |
| Blind Position   | `0/0/5`       | `5.001` |

#### RPC Commands

| Method      | Group Address | DPT     |
| ----------- | ------------- | ------- |
| `setLight`  | `0/0/1`       | `1.001` |
| `moveBlind` | `0/0/3`       | `1.008` |
| `stopBlind` | `0/0/4`       | `1.007` |

The complete ThingsBoard KNX mapping is available in:

```text
gateway/config/myKnxGateway.json
```

# Custom ThingsBoard Gateway Modification

The project uses the official **ThingsBoard IoT Gateway**, but the KNX connector required a modification to its uplink converter for this implementation.

In the local Python virtual environment, the modified Gateway file is located at:

```text
.venv/Lib/site-packages/thingsboard_gateway/connectors/knx/knx_uplink_converter.py
```

> On Linux/macOS, the equivalent `site-packages` path may differ from the Windows path shown above.

The modified version used by this project is included in this repository at:

```text
gateway/patches/knx_uplink_converter.py
```

Therefore, reproducing this project requires using the provided modified converter instead of the default converter installed with ThingsBoard IoT Gateway.

## Project Structure

```text
.
├── ai-home-mcp/
│   ├── src/
│   │   ├── agent.ts
│   │   ├── index.ts
│   │   └── thingsboard.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── yarn.lock
│
├── gateway/
│   ├── config/
│   │   ├── myKnxGateway.json
│   │   └── tb_gateway.example.json
│   │
│   └── patches/
│       └── knx_uplink_converter.py
│
├── knx/
│   ├── ets6/
│   │   └── <ETS6_PROJECT_FILE>
│   │
│   └── knx-virtual/
│       └── <KNX_VIRTUAL_PROJECT_FILE>
│
├── docs/
│   └── project-report.pdf
│
├── .gitignore
└── README.md
```

> The complete ThingsBoard IoT Gateway source code and its Python virtual environment are not included in this repository. The official Gateway is cloned separately and the project-specific configurations and modified KNX converter provided here are applied to it.

# Running the Project

The system consists of several components. Configure and start them in the following order.

## 1. Set Up KNX Virtual

Install and launch **KNX Virtual**.

The KNX Virtual configuration used for this project is included under:

```text
knx/knx-virtual/
```

Load the provided project/configuration where applicable to reproduce the simulated environment.

The simulated smart home contains:

* Light
* Motorized blind
* Temperature sensor

The main KNX Group Addresses are:

```text
0/0/1   Light command
0/0/2   Light state

0/0/3   Blind movement
0/0/4   Blind stop
0/0/5   Blind position

0/0/7   Room temperature
```

## 2. Load the ETS6 Project

Open **ETS6**.

The ETS6 project used for this implementation is provided under:

```text
knx/ets6/
```

Import/open the provided ETS6 project and connect ETS to KNX Virtual through its KNXnet/IP interface.

The included project contains the KNX configuration and Group Addresses used by the ThingsBoard Gateway.

Use the ETS Group Monitor to verify communication before proceeding.

You should be able to control the simulated devices and observe their state changes from ETS.

## 3. Start ThingsBoard

Start a **ThingsBoard Community Edition** instance.

Create a Gateway device in ThingsBoard and obtain its access token.

The project configuration expects the ThingsBoard MQTT service to be reachable at:

```text
Host: 127.0.0.1
Port: 1883
```

If ThingsBoard is running on another machine or container, update the corresponding Gateway configuration.

# ThingsBoard IoT Gateway Setup

The ThingsBoard IoT Gateway is run locally from the official ThingsBoard source inside an isolated Python virtual environment.

## 4. Clone ThingsBoard IoT Gateway

Clone the official ThingsBoard IoT Gateway repository:

```bash
git clone https://github.com/thingsboard/thingsboard-gateway.git
cd thingsboard-gateway
```

## 5. Create a Python Virtual Environment

On Windows:

```powershell
python -m venv .venv
.venv\Scripts\activate
```

On Linux/macOS:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

## 6. Install ThingsBoard IoT Gateway

With the virtual environment activated:

```bash
pip install -e .
```

The Gateway and its Python dependencies will be installed inside the virtual environment.

## 7. Apply the Custom KNX Uplink Converter

This step is **required** for reproducing the implementation used in this project.

The repository contains our modified KNX uplink converter at:

```text
gateway/patches/knx_uplink_converter.py
```

After installing ThingsBoard IoT Gateway, replace the installed:

```text
thingsboard_gateway/connectors/knx/knx_uplink_converter.py
```

with the provided modified version.

For example, in the Windows virtual environment used during development, the installed file was located at:

```text
.venv/Lib/site-packages/thingsboard_gateway/connectors/knx/knx_uplink_converter.py
```

Replace that file with:

```text
gateway/patches/knx_uplink_converter.py
```

The exact `site-packages` location can vary depending on the operating system and Python installation.

## 8. Add the Gateway Configuration

Copy:

```text
gateway/config/myKnxGateway.json
```

to the configuration directory used by your ThingsBoard IoT Gateway.

Then create the local Gateway configuration based on:

```text
gateway/config/tb_gateway.example.json
```

and provide the access token of the Gateway device created in ThingsBoard.

A local installation will therefore contain the equivalent of:

```text
thingsboard-gateway/
├── .venv/
│   └── Lib/
│       └── site-packages/
│           └── thingsboard_gateway/
│               └── connectors/
│                   └── knx/
│                       └── knx_uplink_converter.py
│
├── config/
│   ├── tb_gateway.json
│   └── myKnxGateway.json
│
└── ...
```

The `.venv` directory itself should **not** be committed to GitHub.

## 9. Configure the KNX Connection

Open:

```text
myKnxGateway.json
```

and verify the KNXnet/IP connection settings.

The project uses the standard KNXnet/IP port:

```text
3671
```

If KNX Virtual and the Gateway are running in different environments, update the IP address so that the Gateway can reach the KNX Virtual interface.

## 10. Start the ThingsBoard IoT Gateway

Activate the Python virtual environment:

```powershell
.venv\Scripts\activate
```

or on Linux/macOS:

```bash
source .venv/bin/activate
```

Then start the installed ThingsBoard IoT Gateway.

Verify from the logs that both the ThingsBoard connection and KNX connector have successfully started.

Once connected, KNX telemetry should begin appearing in ThingsBoard.

## 11. Verify Telemetry

Open the KNX smart-home device in ThingsBoard.

The following telemetry should be available:

```text
roomTemperature
lightState
blindPosition
```

Changing the corresponding values in KNX Virtual should update ThingsBoard.

The telemetry path is:

```text
KNX Virtual
     ↓
KNXnet/IP
     ↓
KNX Connector
     ↓
Custom Uplink Converter
     ↓
ThingsBoard IoT Gateway
     ↓
ThingsBoard Telemetry
```

## 12. Verify RPC Control

Send the `setLight` RPC command from ThingsBoard.

For example:

```text
setLight → true
```

should turn the simulated KNX light on.

The complete control path is:

```text
ThingsBoard
     ↓
ThingsBoard IoT Gateway
     ↓
KNX Connector
     ↓
KNXnet/IP
     ↓
KNX Virtual
     ↓
Light
```

# AI Assistant Setup

The AI component is located under:

```text
ai-home-mcp/
```

It consists of:

* TypeScript MCP server
* ThingsBoard REST/RPC integration
* Ollama-based AI agent
* MCP tools for reading and controlling the smart home

## 13. Install Ollama

Install and start Ollama.

Pull the model used by the project:

```bash
ollama pull qwen3:4b
```

Verify that it is available:

```bash
ollama run qwen3:4b
```

## 14. Install AI Dependencies

Navigate to:

```bash
cd ai-home-mcp
```

and install the dependencies:

```bash
yarn install
```

## 15. Configure ThingsBoard Access

The MCP component requires:

```text
THINGSBOARD_URL
THINGSBOARD_USERNAME
THINGSBOARD_PASSWORD
THINGSBOARD_DEVICE_ID
```

For example:

```text
THINGSBOARD_URL=http://localhost:8080
THINGSBOARD_USERNAME=<your ThingsBoard username>
THINGSBOARD_PASSWORD=<your ThingsBoard password>
THINGSBOARD_DEVICE_ID=<your smart-home device ID>
```

Do not commit real ThingsBoard credentials or access tokens to GitHub.

## 16. Run the MCP Server

To run the MCP server directly:

```bash
yarn dev
```

The implemented MCP tools include:

### `get_home_status`

Reads the latest ThingsBoard telemetry:

```text
roomTemperature
lightState
blindPosition
```

### `set_light`

Sends a ThingsBoard RPC command to control the KNX light.

## 17. Run the AI Agent

Start the interactive assistant:

```bash
yarn agent
```

The agent uses the local `qwen3:4b` model through Ollama and connects it to the smart-home MCP tools.

Example Persian commands:

```text
دمای خونه الان چنده؟
```

```text
چراغ روشنه؟
```

```text
چراغ رو روشن کن
```

```text
چراغ رو خاموش کن
```

For a telemetry query:

```text
User
  ↓
Ollama
  ↓
MCP get_home_status
  ↓
ThingsBoard REST API
  ↓
Telemetry
  ↓
Ollama
  ↓
User
```

For a device-control command:

```text
User
  ↓
Ollama
  ↓
MCP set_light
  ↓
ThingsBoard RPC
  ↓
ThingsBoard IoT Gateway
  ↓
KNX Connector
  ↓
KNX Virtual
  ↓
Light
```

# Technologies

* KNX
* KNX Virtual
* ETS6
* ThingsBoard Community Edition
* ThingsBoard IoT Gateway
* MQTT
* Python
* TypeScript
* Model Context Protocol (MCP)
* Ollama
* Qwen3 4B

# Security

Do not commit generated environments, dependencies, logs, or credentials such as:

```text
.env
.venv/
node_modules/
logs/
tb_gateway.json
```

Never commit ThingsBoard access tokens, usernames, or passwords to a public repository.

# Project Report

The complete coursework report, including the architecture, KNX/ETS configuration, ThingsBoard dashboards, AI integration, implementation details, and results, is available under:

```text
docs/project-report.pdf
```

# Authors

This project was developed collaboratively by:

* **[@YOUR_GITHUB_USERNAME](https://github.com/YOUR_GITHUB_USERNAME)**
* **[@TEAMMATE_GITHUB_USERNAME](https://github.com/TEAMMATE_GITHUB_USERNAME)**

Developed as part of an **Internet of Things** course project focusing on smart building automation, KNX, IoT platforms, MCP, and AIoT.
