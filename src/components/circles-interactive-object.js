'use strict';

AFRAME.registerComponent('circles-interactive-object', {
  schema: {
    highlight_color:    {type:'color',      default:'rgb(255,255,255)'},
    hovered_scale:      {type:'number',     default:1.08},
    clicked_scale:      {type:'number',     default:1.08},
    neutral_scale:      {type:'number',     default:1.00}
  },
  init: function() {
    const CONTEXT_AF = this;
    const data = this.data;

    //make sure this is interactive
    if (!CONTEXT_AF.el.classList.contains('interactive')) {
        CONTEXT_AF.el.classList.add('interactive');
    }

    CONTEXT_AF.highlightElem = document.createElement('a-entity');

    const callbackHighlight = (e) => {
        //have to make sure there is geo to copy for highlight first
        if (CONTEXT_AF.el.getObject3D('mesh')) {
            //MUST remove thos when created else an infinite loop will trigger as child highlight elem bubbles object3dset event
            CONTEXT_AF.el.removeEventListener('object3dset', callbackHighlight);
        }
        else {
            return;
        }

        CONTEXT_AF.createHighlightElement(CONTEXT_AF);
    };
    CONTEXT_AF.el.addEventListener('object3dset', callbackHighlight);

    if (CONTEXT_AF.el.getObject3D('mesh')) {
        CONTEXT_AF.createHighlightElement(CONTEXT_AF);
        CONTEXT_AF.el.removeEventListener('object3dset', callbackHighlight);
    }
  },
  update: function(oldData) {
    const CONTEXT_AF = this;
    const data = this.data;

    if (Object.keys(data).length === 0) { return; } // No need to update. as nothing here yet

    //highlight color change
    if ( (oldData.highlight_color !== data.highlight_color) && (data.highlight_color !== '') ) {
        CONTEXT_AF.highlightElem.highlight_color = data.highlight_color;
        CONTEXT_AF.highlightElem.setAttribute('material', {color:data.highlight_color});
    }

    //size changes
    if ( (oldData.hovered_scale !== data.hovered_scale) && (data.hovered_scale !== '') ) {
        CONTEXT_AF.highlightElem.hovered_scale = data.hovered_scale;
    }

    if ( (oldData.clicked_scale !== data.clicked_scale) && (data.clicked_scale !== '') ) {
        CONTEXT_AF.highlightElem.clicked_scale = data.clicked_scale;
    }

    if ( (oldData.neutral_scale !== data.neutral_scale) && (data.neutral_scale !== '') ) {
        CONTEXT_AF.highlightElem.neutral_scale = data.neutral_scale;
        CONTEXT_AF.highlightElem.setAttribute('scale', {x:data.neutral_scale, y:data.neutral_scale, z:data.neutral_scale});
    }
  },
  createHighlightElement : function (CONTEXT_AF) {
    const data = CONTEXT_AF.data;
    let modelElem = CONTEXT_AF.el;

    CONTEXT_AF.highlightElem = null;
    CONTEXT_AF.highlightElem = document.createElement('a-entity');
    
    //need to do this for loaded objects like gltf ...
    CONTEXT_AF.highlightElem.addEventListener('model-loaded', function (e) {
        let model               = CONTEXT_AF.highlightElem.getObject3D('mesh');
        let flatMat             = new THREE.MeshBasicMaterial();
        flatMat.color           = new THREE.Color(data.highlight_color);
        flatMat.transparency    = false;
        flatMat.side            = THREE.BackSide;

        model.traverse(function(node) {
            if (node.isMesh) {
                node.material = flatMat;
                node.castShadow = false;
                node.receiveShadow = false;
            } 
        });
    });

    CONTEXT_AF.highlightElem.setAttribute('class', 'object_highlight');

    const keys      = Object.keys(modelElem.components);
    const values    = Object.values(modelElem.components);

    //loop through existing components and copy over as efforts to clone just geo is a deadend currently with gltfs
    for(let i = keys.length - 1; i >= 0; i--) {
        if (    keys[i] !== 'id' && 
                keys[i] !== 'class' && 
                keys[i] !== 'material' && 
                keys[i] !== 'position' && 
                keys[i] !== 'rotation' && 
                keys[i] !== 'scale' &&
                keys[i] !== 'sound' && 
                keys[i] !== 'circles-sphere-env-map' && 
                keys[i] !== 'shadow' && 
                keys[i] !== 'visible' && 
                keys[i] !== 'circles-interactive-object' &&
                keys[i] !== 'circles-checkpoint' &&
                keys[i] !== 'circles-sendpoint' &&
                keys[i] !== 'circles-spawnpoint' &&
                keys[i] !== 'circles-object-label' &&
                keys[i] !== 'networked' &&
                keys[i] !== 'circles-inspect-object' &&
                keys[i] !== 'circles-object-world' && 
                keys[i] !== 'circles-artefact' ) {

                CONTEXT_AF.highlightElem.setAttribute(keys[i], values[i].data);
        }
    }

    //inverse shell method as post-processing is far too expensive for mobile VR (setting mat also so that primitives also work)
    CONTEXT_AF.highlightElem.setAttribute('material', {color:data.highlight_color, shader:'flat', side:'back'});    
    CONTEXT_AF.highlightElem.setAttribute('scale', {x:data.neutral_scale, y:data.neutral_scale, z:data.neutral_scale});
    CONTEXT_AF.highlightElem.setAttribute('shadow', {cast:false, receive:false});
    CONTEXT_AF.highlightElem.setAttribute('visible', (Math.abs(data.neutral_scale - 1.0) > Number.EPSILON)); //don't hide if neutral scale is larger suggestinga  want for a permanent outline
    modelElem.appendChild(CONTEXT_AF.highlightElem);

    //clicked
    modelElem.addEventListener('click', (e) => {
        CONTEXT_AF.highlightElem.setAttribute('scale', {x:data.clicked_scale, y:data.clicked_scale, z:data.clicked_scale});
        const timeoutObj = setTimeout(() => {
            CONTEXT_AF.highlightElem.setAttribute('scale', {x:data.hovered_scale, y:data.hovered_scale, z:data.hovered_scale});
            clearTimeout(timeoutObj);
          }, 200);
    });

    //hovering
    modelElem.addEventListener('mouseenter', (e) => {
        CONTEXT_AF.highlightElem.setAttribute('visible', true);
        CONTEXT_AF.highlightElem.setAttribute('scale', {x:data.hovered_scale, y:data.hovered_scale, z:data.hovered_scale});
    });

    //not hovering
    modelElem.addEventListener('mouseleave', (e) => {
        CONTEXT_AF.highlightElem.setAttribute('visible', (Math.abs(data.neutral_scale - 1.0) > Number.EPSILON));
        CONTEXT_AF.highlightElem.setAttribute('scale', {x:data.neutral_scale, y:data.neutral_scale, z:data.neutral_scale});
    });
  },
  remove: function () {}
});