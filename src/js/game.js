import {tiles} from './model/tilesPack';

var shuffle = require('shuffle-array');

export class Game {
    constructor() {
        this.tilesCount = tiles.length;

        this.$board = $('#board');
        this.$undo = $('#undo');
        this.$search = $('#search');
        this.$centerOfBoard = $('#center');

        this._prepareBoard();
        this._placeTiles();
        this._addHandlers();
    }

    _prepareBoard() {
        const TILES_SET = {
            ROWS: 8,
            CELLS: 12,
            TILES_PER_ROWS: [12, 8, 10, 12, 12, 10, 8, 12],
            NEXT: {
                ROWS: 6,
                CELLS: 6,
                NEXT: {
                    ROWS: 4,
                    CELLS: 4,
                    NEXT: {
                        ROWS: 2,
                        CELLS: 2,
                        NEXT: {
                            ROWS: 1,
                            CELLS: 1
                        }
                    }
                }
            }

        };

        /**
         * Generates board markup
         */
        let centralTilesHtml = (function (tilesParams) {
            let result = '';

            function createTilesLayer(param, isOverlay) {
                let tilesetClass = !isOverlay ? 'tileset' : 'tileset tileset_overlay';

                result += '<div class="' + tilesetClass + '">'
                    + [...generateRows(param)].join('') + '</div>';

                return param.NEXT ? createTilesLayer(param.NEXT, true) : result;
            }

            function* generateRows({ROWS: rowsCounter, CELLS: cells, TILES_PER_ROWS: tilesPerRows}) {
                let totalRows = rowsCounter;

                while (rowsCounter) {
                    let tilesPerRow = tilesPerRows ? tilesPerRows[totalRows - rowsCounter] : cells;


                    yield* '<div class="tiles-row">' + [...generateCells(cells, tilesPerRow)].join('') + '</div>'
                    rowsCounter--;
                }
            }

            function* generateCells(cellsCounter, tilesPerRow) {
                let startIndex = tilesPerRow + (cellsCounter - tilesPerRow) / 2;
                let finalIndex = (cellsCounter - tilesPerRow) / 2 + 1;

                while (cellsCounter) {
                    if (cellsCounter <= startIndex && cellsCounter >= finalIndex) {
                        yield '<div class="cell tile"></div>';
                    }
                    else {
                        yield '<div class="cell"></div>';
                    }

                    cellsCounter--;
                }
            }

            return createTilesLayer(tilesParams);
        })(TILES_SET);

        this.$centerOfBoard.append(centralTilesHtml);
    }

    _placeTiles() {
        let $tilesPlaces = this.$board.find('div.tile');

        let shuffledTiles = shuffle(tiles);

        $tilesPlaces.each(function (index) {
            $(this).append($('<img>', {alt: 'tile', src: shuffledTiles[index].imgPath}))
                .data({value: shuffledTiles[index].value, type: shuffledTiles[index].type});
        })
    }

    _addHandlers() {
        let self = this;

        let $selectedTile = null;
        let $selectionFrame = $('<div></div>', {class: 'frame'});
        let coords = { clientX: undefined, clientY: undefined };

        $(window).on('keydown', function (event) {
            if (event.metaKey && event.key === 'z') {
                undo()
                event.preventDefault();
                event.stopPropagation();
            }
        });

        this.$undo.on('click', function () {
            undo()
        });

        this.$search.on('click', function () {
            searchPair();
        });

        this.$board.on('click', function (event) {
            let $targetContainer = $(event.target).parent();

            // Saves coords for recursive call of event handler on underlying element
            if (event.clientX && event.clientY) {
                coords.clientX = event.clientX;
                coords.clientY = event.clientY;
            }

            if ($targetContainer.hasClass('tiles-row')) {
                let $overlay = $targetContainer.parents('.tileset_overlay');

                if (!$overlay.length) return;

                $overlay.hide();
                $(document.elementFromPoint(coords.clientX, coords.clientY)).trigger("click");
                $overlay.show();

                return;
            }

            if (isAvailableTile($targetContainer)) {
                if (!$selectedTile) {
                    $selectedTile = $targetContainer;

                    addSelection($selectedTile);
                }
                else {
                    if ($selectedTile.is($targetContainer)) {
                        clearSelection();
                    }
                    else if (isTilesEqual($selectedTile, $targetContainer)) {
                        removeTiles($selectedTile, $targetContainer);
                        clearSelection();

                        if (self.tilesCount === 0) {
                            alert('You are the winner!');

                            location.reload();
                        }
                    }
                    else {
                        $selectedTile = $targetContainer;

                        addSelection($selectedTile);
                    }
                }
            }
        });

        const turns = []

        function removeTiles($selectedTile, $targetTile) {
            const turn = []
            clearSelection();
            $.each(arguments, function(index, $tile) {
                turn.push({
                    parent: $tile.parent(),
                    index: $tile.index(),
                    tile: $tile.clone(true, true)
                })
                $tile.removeClass('tile').children().remove();
                --self.tilesCount;
            });
            turns.push(turn)
        }

        function undo() {
            const turn = turns.pop()
            if (turn) {
                $.each(turn, function(_, {parent, index, tile}) {
                    parent.children().eq(index).replaceWith(tile)
                    ++self.tilesCount;
                })
            }
        }

        function isTilesEqual($selectedTile, $targetTile) {
            let selectedTileData = $selectedTile.data();
            let targetData = $targetTile.data();

            return selectedTileData.value === targetData.value
                && selectedTileData.type === targetData.type;
        }

        function isAvailableTile($target) {
            if (!$target.is('div.tile')) return false;

            let $parent = $target.parent();
            let $tilesSet = $target.parents('.tileset');
            let tileSetIndex = $tilesSet.index();
            let rowIndex = $parent.index();
            let tileIndex = $target.index();

            // has upper tile
            let upperTile = false
            if (tileSetIndex === 0 && rowIndex > 0 && rowIndex < 7 && tileIndex > 2 && tileIndex < 9) {
                upperTile = $('.tileset').eq(1).find('.tiles-row').eq(rowIndex - 1).find('.cell').eq(tileIndex - 3).is('.tile');
            } else if (tileSetIndex === 1 && rowIndex > 0 && rowIndex < 5 && tileIndex > 0 && tileIndex < 5) {
                upperTile = $('.tileset').eq(2).find('.tiles-row').eq(rowIndex - 1).find('.cell').eq(tileIndex - 1).is('.tile');
            } else if (tileSetIndex === 2 && rowIndex > 0 && rowIndex < 4 && tileIndex > 0 && tileIndex < 3) {
                upperTile = $('.tileset').eq(3).find('.tiles-row').eq(rowIndex - 1).find('.cell').eq(tileIndex - 1).is('.tile');
            } else if (tileSetIndex === 3) {
                upperTile = $('.tileset').eq(4).find('div.tile').length > 0;
            }

            if (upperTile) return;

            let $firstAvailableTile = $parent.find('div.tile:first');
            let $lastAvailableTile = $parent.find('div.tile:last');

            // closed central rows
            let closedRowsNumbers = [3, 4];

            let isLeftPartHasTile = $('#left').find('div.tile').length;
            let isRightPartHasTile = $('#right').find('div.tile').length;

            let isUndermostTileset = tileSetIndex === 0;
            let isCentralRowNotAvailable = (isLeftPartHasTile && $target.is($firstAvailableTile)) || (isRightPartHasTile && $target.is($lastAvailableTile));
            let isFirstElementOfRightRowNotAvailable = $target.parents('#right').length && $target.siblings('.tile').length && $target.is($firstAvailableTile);

            if (isUndermostTileset && isCentralRowNotAvailable && ~$.inArray(rowIndex, closedRowsNumbers)) return;
            if (isFirstElementOfRightRowNotAvailable) return;

            return ($target.is($firstAvailableTile) || $target.is($lastAvailableTile));
        }

        function addSelection() {
            $selectedTile.prepend($selectionFrame);
        }

        function clearSelection() {
            $selectedTile = null;
            $selectionFrame.remove();
        }

        let lastFound = 0
        function searchPair() {
            const $tiles = self.$board.find('div.tile');
            const $tilesArray = $tiles.toArray();

            for (let i = lastFound + 1; i < $tilesArray.length; i++) {
                for (let j = i + 1; j < $tilesArray.length; j++) {
                    if (
                        isTilesEqual($($tilesArray[i]), $($tilesArray[j])) &&
                        isAvailableTile($($tilesArray[i])) &&
                        isAvailableTile($($tilesArray[j]))
                    ) {
                        lastFound = i;
                        clearSelection();
                        $selectedTile = $($tilesArray[j]);
                        addSelection($selectedTile);
                        return;
                    }
                }
            }
            if (lastFound === 0) {
                alert('No pairs found');
            } else {
                lastFound = 0;
                searchPair();
            }
        }
    }
}