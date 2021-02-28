// stores the whole multi-line selected text
let selectedText = '';
/* storing all the nodes which are modified so that
 they can be restored after a certain event */
let selectedNodes = [];

// let saveButton = null;

/* using Depth First Search(dfs) algo to traverse the DOM tree
 and store all the Text leaf nodes in between start and end */
function getSelectedNodes(root, start, end) {
  let allowedToPush = false;
  const stack = [];

  stack.push(root);

  while (stack.length) {
    const curNode = stack.pop();

    if (curNode.nodeType === 3) {
      if (curNode === end) {
        selectedNodes.push(curNode);
        return;
      }
      if (allowedToPush && curNode.textContent.toString().trim() !== '') {
        selectedNodes.push(curNode);
      }
      if (curNode === start) {
        allowedToPush = true;
        selectedNodes.push(curNode);
      }
    }

    const length = curNode.childNodes.length;
    for (let i = length - 1; i >= 0; i--) {
      stack.push(curNode.childNodes[i]);
    }
  }
}

/* provides the range of the current selection
 start and end node with offsets */
function getRange() {
  if (window.getSelection) {
    const selection = window.getSelection();

    if (selection.toString().trim() !== '') {
      selectedText += selection.toString().trim();
      return selection.getRangeAt(0);
    }
  }
  return null;
}

// highlight all the currently selected text in the document
function highlight() {
  const lastLength = selectedNodes.length;
  const range = getRange();

  // is range if null then the selection is invalid
  if (range == null) return;

  const start = {
    node: range.startContainer,
    offset: range.startOffset,
  };
  const end = {
    node: range.endContainer,
    offset: range.endOffset,
  };

  // is start or end node type is not text the discard selection
  if (start.node.nodeType !== 3 || end.node.nodeType !== 3) {
    return;
  }

  const sameNodes = start.node === end.node;

  const endNode = end.node;
  endNode.splitText(end.offset);
  const startNode = start.node.splitText(start.offset);

  if (sameNodes) {
    selectedNodes.push(startNode);
  } else {
    const body = document.querySelector('body');
    getSelectedNodes(body, startNode, endNode);
  }

  /* wrapping the selected nodes in the span dom element and the
  apply the background color to all of these nodes */
  for (let i = lastLength; i < selectedNodes.length; i++) {
    const wrapper = document.createElement('span');
    wrapper.setAttribute('class', '__highlight_text__');
    wrapper.setAttribute('draggable', 'true');
    const newNode = selectedNodes[i].cloneNode(true);
    wrapper.appendChild(newNode);
    selectedNodes[i].parentNode.replaceChild(wrapper, selectedNodes[i]);
    selectedNodes[i] = newNode;
  }
}

/* remove highlightes from all the nodes which are modified with 
  help of selectedNodes Array */
function removeHighlight() {
  selectedNodes.reverse();
  selectedNodes.forEach((node) => {
    const parent = node.parentNode;
    const grandParent = node.parentNode.parentNode;
    grandParent.replaceChild(node, parent);
  });
  selectedNodes.forEach((node) => {
    if (node !== null && node.parentNode !== null) {
      const parent = node.parentNode;
      parent.normalize();
    }
  });
  selectedText = '';
  selectedNodes = [];
}

function deselectAll() {
  if (window.getSelection) {
    window.getSelection().removeAllRanges();
  }
}

// For NoteDown App script
// function hideSaveOption() {
//   if (saveButton === null) return;
//   const body = document.querySelector('body');
//   body.removeChild(saveButton);
//   saveButton = null;
// }

// function showSaveOption(x_axis, y_axis) {
//   const body = document.querySelector('body');
//   saveButton = document.createElement('button');
//   saveButton.setAttribute('style', `left:${x_axis}px; top:${y_axis}px;`);
//   saveButton.setAttribute('class', 'saveButton');
//   saveButton.textContent = 'Save';
//   saveButton.addEventListener('click', () => {
//     // save to database & copy to clipboard
//     /*
//     sending selected text to the service worker.
//     service worker updates the note in the local storage.
//   */
//     const title = document.querySelector('title').textContent;
//     const url = window.location.href;
//     chrome.runtime.sendMessage({
//       operation: 'addNote',
//       notes: { title, url, note: selectedText },
//     });
//     removeHighlight();
//     hideSaveOption();
//   });
//   body.appendChild(saveButton);
// }

/* if ctrl key is not pressed then remove all 
the previous selected nodes */
document.addEventListener('mousedown', (event) => {
  // if (event.target === saveButton) return;
  // hideSaveOption();
  if (!event.ctrlKey) {
    removeHighlight();
  }
});

document.addEventListener('mouseup', (event) => {
  if (!event.ctrlKey) return;
  highlight();
  deselectAll();
  // selected text is stored in selectedText variable;
  if (selectedText === '') return;

  selectedText += '\n';

  // event object provides the location of the mouseup(x- axis & y-axis)
  // using these coordinates to show save option to user
  // showSaveOption(event.pageX, event.pageY);
});

document.addEventListener('copy', (event) => {
  if (selectedText.length !== 0) {
    event.clipboardData.setData('text/plain', selectedText);
    event.preventDefault(); // prevents default copy event
  }
});
