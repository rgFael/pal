document.addEventListener("DOMContentLoaded", () => {
  const jsonInput = document.getElementById("json-input");
  const trainerNameInput1 = document.getElementById("trainer-name-1");
  const calculateBtn = document.getElementById("calculate-btn");
  const messageDiv = document.getElementById("message");
  const resultsTableContainer = document.getElementById("results-table-container");
  const totalPointsDiv = document.getElementById("total-points");
  const recordsContainer = document.getElementById("records-container");
  const themeToggleBtn = document.getElementById("theme-toggle");
  const buttonText = document.getElementById("button-text");
  const progressBarFill = document.getElementById("progress-bar-fill");

  const puntos = {
    "HOTEL #1": 8,
    "HOTEL #2": 8,
    "KOK": 4,
    "SAZE": 15,
    "HOTELESS": 10,
    "POKE BALL D'OR": 20,
    "LA LIGA": 40,
    "MUNDIAL": { "1er Lugar": 200, "2do Lugar": 100, "3er Lugar": 50 },
    "WVC": 300
  };

  // --- Funcionalidad de Modo Oscuro ---
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  }

  themeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const currentTheme = document.body.classList.contains("dark-mode") ? "dark" : "light";
    localStorage.setItem("theme", currentTheme);
  });

  // --- Guardar/Cargar JSON en localStorage ---
  const savedJson = localStorage.getItem("trainerSeasonsJson");
  if (savedJson) {
    jsonInput.value = savedJson;
  }
  jsonInput.addEventListener("input", () => {
    localStorage.setItem("trainerSeasonsJson", jsonInput.value);
  });

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message-box ${type}`;
  }

  function clearResults() {
    messageDiv.className = "message-box";
    messageDiv.innerHTML = "";
    resultsTableContainer.innerHTML = "";
    totalPointsDiv.innerHTML = "";
    recordsContainer.innerHTML = "";
  }

  function setLoadingState(isLoading) {
    if (isLoading) {
      buttonText.style.opacity = "0";
      calculateBtn.disabled = true;
    } else {
      buttonText.style.opacity = "1";
      calculateBtn.disabled = false;
      progressBarFill.style.width = "0";
    }
  }

  function getValueColorClass(value) {
    if (value >= 20000000) return 'value-golden';
    if (value >= 10000000) return 'value-premium';
    if (value >= 5000000) return 'value-high';
    if (value >= 1000000) return 'value-mid';
    return 'value-low';
  }

  function createAndAnimateTable(data, trainerName) {
    resultsTableContainer.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Temporada</th>
            <th>Puntos</th>
            <th>Valor acumulado</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    `;
    const tbody = resultsTableContainer.querySelector('tbody');
    const totalRows = data.length;
    let rowsAdded = 0;

    data.forEach((row, index) => {
      setTimeout(() => {
        const tr = document.createElement('tr');
        const colorClass = getValueColorClass(row.valorAcumulado);
        tr.innerHTML = `
          <td>${row.temporada}</td>
          <td>${row.puntos}</td>
          <td class="${colorClass}">¥${row.valorAcumulado.toLocaleString()}</td>
        `;
        tbody.appendChild(tr);

        // Actualiza la barra de progreso
        const progress = ((index + 1) / (totalRows + 2)) * 100;
        progressBarFill.style.width = `${progress}%`;

        rowsAdded++;
        if (rowsAdded === totalRows) {
          setTimeout(() => {
            displayTotalSummary(data);
            displayRecords(data);
            progressBarFill.style.width = "100%";
            setTimeout(() => {
                showMessage("¡Cálculo completado exitosamente!", "success");
                setLoadingState(false);
            }, 500);
          }, 500);
        }
      }, 150 * index);
    });
  }

  function calculateTrainerValue(temporadas, trainerName) {
    const resultados = [];
    let acumulado = 0;
    const lowerCaseTrainerName = trainerName.toLowerCase();

    temporadas.forEach(temp => {
      let puntosTemp = 0;
      
      for (const torneo in temp) {
        if (temp.hasOwnProperty(torneo) && torneo !== "TEMPORADA") {
          const valorTorneo = temp[torneo];
          if (typeof valorTorneo === "string" && valorTorneo.toLowerCase() === lowerCaseTrainerName) {
            const key = Object.keys(puntos).find(k => k.toLowerCase() === torneo.toLowerCase());
            if (key) {
              puntosTemp += puntos[key];
            }
          }
        }
      }
      
      acumulado += puntosTemp * 50000;
      resultados.push({
        temporada: temp.TEMPORADA,
        puntos: puntosTemp,
        valorAcumulado: acumulado
      });
    });

    return resultados;
  }
  
  function displayTotalSummary(resultados) {
    const totalAcumulado = resultados[resultados.length - 1].valorAcumulado;
    const totalPuntos = resultados.reduce((sum, current) => sum + current.puntos, 0);

    totalPointsDiv.innerHTML = `
      Puntos Totales: ${totalPuntos} | Valor Acumulado Total: ¥${totalAcumulado.toLocaleString()}
    `;
  }

  function displayRecords(resultados) {
    let maxPuntosTemp = { puntos: 0, temporada: '' };
    let maxValorJump = { jump: 0, temporada: '' };
    
    resultados.forEach((res, index) => {
      if (res.puntos > maxPuntosTemp.puntos) {
        maxPuntosTemp = { puntos: res.puntos, temporada: res.temporada };
      }
      
      if (index > 0) {
        const valorAnterior = resultados[index - 1].valorAcumulado;
        const jump = res.valorAcumulado - valorAnterior;
        if (jump > maxValorJump.jump) {
          maxValorJump = { jump: jump, temporada: res.temporada };
        }
      }
    });

    recordsContainer.innerHTML = `
      <h3>Récords del Entrenador</h3>
      <p class="record-item">Mayor cantidad de puntos en una temporada: <strong>${maxPuntosTemp.puntos}</strong> puntos (${maxPuntosTemp.temporada})</p>
      <p class="record-item">Mayor salto de valor en una temporada: <strong>¥${maxValorJump.jump.toLocaleString()}</strong> (${maxValorJump.temporada})</p>
    `;
  }

  calculateBtn.addEventListener("click", () => {
    clearResults();
    setLoadingState(true);

    const jsonInputVal = jsonInput.value.trim();
    const trainerName = trainerNameInput1.value.trim();

    setTimeout(() => {
      if (!jsonInputVal || !trainerName) {
        showMessage("Por favor, ingresa el JSON y el nombre del entrenador.", "error");
        setLoadingState(false);
        return;
      }

      let temporadas;
      try {
        temporadas = JSON.parse(jsonInputVal);
        if (!Array.isArray(temporadas) || temporadas.length === 0) {
          throw new Error("El JSON debe ser un array no vacío de objetos.");
        }
      } catch (e) {
        showMessage(`JSON inválido: ${e.message}. Revisa la sintaxis.`, "error");
        setLoadingState(false);
        return;
      }

      const resultados = calculateTrainerValue(temporadas, trainerName);
      
      if (resultados.every(res => res.puntos === 0)) {
        showMessage(`No se encontraron puntos para el entrenador "${trainerName}".`, "error");
        setLoadingState(false);
        return;
      }

      createAndAnimateTable(resultados, trainerName);
    }, 500);
  });
});